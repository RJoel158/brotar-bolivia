require('reflect-metadata');
const {PrismaClient}=require('@prisma/client');
const fs=require('node:fs');const path=require('node:path');const {randomUUID}=require('node:crypto');
const u=new URL(process.env.DATABASE_URL||'');if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('Isolated QA required');
const request=url=>fetch(url,{signal:AbortSignal.timeout(5000)});
const db=new PrismaClient();const results=[];const output=process.argv[2];
const record=(name,ok,details)=>{results.push({name,ok,details});fs.writeFileSync(output,JSON.stringify({at:new Date().toISOString(),environment:'isolated-qa',results},null,2));fs.writeFileSync(path.join(path.dirname(output),'2026-10-22-Home-'+name+'.md'),'# Home: '+name+'\n\nAgente: Codex. Proyecto: Brotar. Fecha UTC: '+new Date().toISOString()+'\n\n- Entorno: QA local sintetico.\n- Resultado: '+(ok?'PASS':'FAIL')+'\n- Evidencia: `'+path.basename(output)+'`\n\n```json\n'+JSON.stringify(details,null,2)+'\n```\n\nMejora pendiente: repetir con datos y entorno de staging representativos.\n');console.log(name,ok?'PASS':'FAIL');};
(async()=>{
 const owner=await db.users.findFirst({where:{role:'creator'}});const fixture=randomUUID();
 await db.campaign.create({data:{id:fixture,owner_user_id:owner.id,title:'Home global QA',slug:randomUUID(),category:'salud',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:100,current_amount:10000,status:'published',created_at:new Date('2000-01-01')}});
 try {
 const raw=await request('http://127.0.0.1:3100/campaigns');const all=await raw.json();
 const response=await request('http://127.0.0.1:3100/campaigns/home');const text=await response.text();const home=JSON.parse(text);
 const score=c=>c.goalAmount<=0?0:Math.min(100,Math.round(c.currentAmount/c.goalAmount*100));
 const sorted=[...all].sort((a,b)=>score(b)-score(a)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
 record('global-featured',response.status===200&&home.featured.id===sorted[0].id&&!all.slice(0,24).some(c=>c.id===home.featured.id),{status:response.status,featuredMatchesGlobal:home.featured.id===sorted[0].id,notRestrictedToFirstPage:!all.slice(0,24).some(c=>c.id===home.featured.id)});
 const grid=all.filter(c=>c.id!==home.featured.id);const counts={};for(const c of grid)counts[c.category]=(counts[c.category]||0)+1;
 record('global-counts-categories',home.projects===all.length&&JSON.stringify(Object.entries(home.categoryCounts).sort())===JSON.stringify(Object.entries(counts).sort())&&[...home.categories].sort().join()===Object.keys(counts).sort().join(),{projects:home.projects,categoryCounts:home.categoryCounts});
 const raised=all.reduce((s,c)=>s+c.currentAmount,0);const progress=Math.round(all.reduce((s,c)=>s+score(c),0)/all.length);
 record('global-impact-equivalence',Number(home.raised)===raised&&home.progress===progress&&home.currency===all[0].currency,{raised:home.raised,progress:home.progress,currency:home.currency});
 const forbidden=['password','password_hash','kyc_document_front','kyc_document_back'];record('bounded-public-payload',Buffer.byteLength(text)<10000&&forbidden.every(k=>!text.includes('"'+k+'"')),{bytes:Buffer.byteLength(text),campaignObjects:home.featured?1:0});
 let cursor,ids=[];do{const r=await request('http://127.0.0.1:3100/campaigns/catalog?limit=24'+(cursor?'&cursor='+cursor:''));const page=await r.json();ids.push(...page.items.map(c=>c.id));cursor=page.nextCursor;}while(cursor);
 record('home-grid-complete',ids.length===all.length&&new Set(ids).size===all.length&&all.every(c=>ids.includes(c.id)),{published:all.length,traversed:ids.length});
 } finally {await db.campaign.delete({where:{id:fixture}});}
 if(results.some(r=>!r.ok))process.exitCode=1;
})().catch(e=>{console.error(e.code||e.name);process.exitCode=1}).finally(()=>db.$disconnect());
