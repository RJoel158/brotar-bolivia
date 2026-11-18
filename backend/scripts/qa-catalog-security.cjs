require('reflect-metadata');
const {PrismaClient}=require('@prisma/client');const {JwtService}=require('@nestjs/jwt');
const fs=require('node:fs');const {randomUUID}=require('node:crypto');
const u=new URL(process.env.DATABASE_URL||'');if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('Isolated QA required');
const db=new PrismaClient();
(async()=>{
 const results=[];const record=(name,ok,details)=>{results.push({name,ok,details});console.log(name,ok?'PASS':'FAIL')};
 const owner=await db.users.findFirst({where:{role:'creator'}});
 const id=randomUUID();await db.campaign.create({data:{id,owner_user_id:owner.id,title:'Literal '+id+' %_ QA',slug:'qa-'+id,category:'salud',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:1000,status:'published'}});
 await db.campaign.create({data:{owner_user_id:owner.id,title:'Literal '+id+' AB QA',slug:'qa-'+randomUUID(),category:'salud',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:1000,status:'published'}});
 const tied=Array.from({length:3},()=>({id:randomUUID(),owner_user_id:owner.id,title:'Cursor precision QA',slug:randomUUID(),category:'ambiental',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:1000,status:'published'}));
 await db.campaign.createMany({data:tied});
 for(const row of tied)await db.$executeRaw`UPDATE campaigns SET created_at='2025-01-01T00:00:00.123456Z'::timestamptz WHERE id=${row.id}::uuid`;
 const base='http://127.0.0.1:3100';
 const get=async path=>{const r=await fetch(base+path,{signal:AbortSignal.timeout(5000)});return {status:r.status,data:await r.json(),headers:r.headers}};
 const expected=await db.campaign.findMany({where:{status:'published'},orderBy:[{created_at:'desc'},{id:'desc'}],select:{id:true}});
 let cursor,ids=[],pages=0,valid=true;
 do{const page=await get('/campaigns/catalog?limit=7'+(cursor?'&cursor='+cursor:''));valid&&=page.status===200&&page.data.items.length<=7;ids.push(...page.data.items.map(x=>x.id));cursor=page.data.nextCursor;pages++;if(pages>1000)throw Error('Pagination did not terminate')}while(cursor);
 record('catalog-all-pages-equivalent',valid&&JSON.stringify(ids)===JSON.stringify(expected.map(x=>x.id))&&new Set(ids).size===ids.length,{pages,expected:expected.length,actual:ids.length});
 let response=await get('/campaigns/catalog?query='+encodeURIComponent(id+' %_'));record('literal-search',response.status===200&&response.data.items.length===1&&response.data.items[0].id===id,{status:response.status,matches:response.data.items?.length});
 response=await get('/campaigns/catalog?category=salud&query='+encodeURIComponent(id+' %_'));record('server-filter-search',response.status===200&&response.data.items.length===1&&response.data.items[0].id===id,{status:response.status});
 for(const query of ['limit=0','limit=49','limit=1.5','cursor=invalid','category=invalid','status=draft']){response=await get('/campaigns/catalog?'+query);record('invalid-query-'+query,response.status===400,{status:response.status})}
 const jwt=new JwtService({secret:require('../dist/users/infrastructure/config/jwt.config').getJwtSecret()});const token=jwt.sign({sub:owner.id});
 const missing=await fetch(base+'/users/me/kyc',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({documentType:'CI',documentId:'1234567',documentFrontUrl:'https://example.test/front.jpg'})});
 record('ci-reverse-required',missing.status===400,{status:missing.status});
 const oversized=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'qa@example.test',password:'x'.repeat(20000)})});record('auth-body-limit',oversized.status===413,{status:oversized.status});
 const sponsor=await db.users.findFirst({where:{role:'sponsor'}});
 const password=randomUUID()+randomUUID();await db.users.update({where:{id:sponsor.id},data:{password_hash:await require('bcrypt').hash(password,10),status:'active'}});
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:sponsor.email,password})});
 const loginBody=await login.json();record('login-happy-path',login.status===200&&Boolean(loginBody.accessToken),{status:login.status});
 const auth={Authorization:'Bearer '+loginBody.accessToken,'Content-Type':'application/json'};
 const donation=await db.campaign.create({data:{owner_user_id:owner.id,title:'Flujo feliz QA',slug:'qa-'+randomUUID(),category:'ambiental',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:1000,status:'published',end_date:new Date('2030-01-01')}});
 const created=await fetch(base+'/contributions',{method:'POST',headers:auth,body:JSON.stringify({campaignId:donation.id,amount:100,contributionType:'donation'})});
 const contribution=await created.json();let paidStatus=null,approved=false;
 if(created.status===201){const paid=await fetch(base+'/contributions/'+contribution.id+'/pay',{method:'POST',headers:auth,body:JSON.stringify({method:'qr'})});paidStatus=paid.status;approved=(await paid.json()).approved===true;}
 const balance=await db.campaign.findUnique({where:{id:donation.id}});
 record('contribution-happy-path',created.status===201&&paidStatus===200&&approved&&balance.current_amount.toString()==='100',{createStatus:created.status,payStatus:paidStatus,balance:balance.current_amount.toString()});
 const listed=await fetch(base+'/contributions/me',{headers:auth});record('contribution-history-happy-path',listed.status===200,{status:listed.status});
 const statuses=[];for(let i=0;i<12;i++){const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'198.51.100.'+i},body:'{}'});statuses.push(r.status)}
 record('auth-rate-limit-unspoofed-ip',statuses.slice(0,9).every(x=>x===400)&&statuses.slice(9).every(x=>x===429),{statuses});
 const register=[];for(let i=0;i<6;i++){const r=await fetch(base+'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});register.push(r.status)}record('register-rate-limit',register.slice(0,5).every(x=>x===400)&&register[5]===429,{statuses:register});
 const cors=await fetch(base+'/campaigns/catalog',{headers:{Origin:'https://untrusted.example.test'}});record('cors-untrusted-origin',cors.headers.get('access-control-allow-origin')===null,{status:cors.status});
 await db.campaign.delete({where:{id:tied[0].id}});
 const deletedCursor=await get('/campaigns/catalog?cursor='+tied[0].id);record('catalog-deleted-cursor',deletedCursor.status===409,{status:deletedCursor.status});
 const plan=await db.$queryRawUnsafe("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM campaigns WHERE status='published' ORDER BY created_at DESC,id DESC LIMIT 25");
 fs.writeFileSync(process.argv[2],JSON.stringify({at:new Date().toISOString(),environment:'isolated-qa',results,plan},null,2));if(results.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error('QA execution failed:',e.code||e.name);process.exitCode=1}).finally(()=>db.$disconnect());
