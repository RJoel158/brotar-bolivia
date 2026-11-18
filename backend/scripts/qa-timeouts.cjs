require('reflect-metadata');
const {PrismaService}=require('../dist/shared/persistence/prisma.service');const fs=require('node:fs');
const u=new URL(process.env.DATABASE_URL||'');if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('Isolated QA required');
const normal=new PrismaService();
(async()=>{
 const tests=[];const record=(name,ok,details)=>{tests.push({name,ok,details});fs.writeFileSync(process.argv[2],JSON.stringify({at:new Date().toISOString(),environment:'isolated-qa',tests},null,2));console.log(name,ok?'PASS':'FAIL')};
 const defaults=await normal.$queryRawUnsafe("SELECT current_setting('statement_timeout') AS statement,current_setting('lock_timeout') AS lock,current_setting('idle_in_transaction_session_timeout') AS idle");record('api-session-defaults',defaults[0].statement==='15s'&&defaults[0].lock==='3s'&&defaults[0].idle==='15s',defaults);
 const url=new URL(process.env.DATABASE_URL);url.searchParams.set('connection_limit','1');url.searchParams.set('pool_timeout','1');url.searchParams.set('options','-c statement_timeout=150 -c lock_timeout=100 -c idle_in_transaction_session_timeout=15000');
 const short=new PrismaService({datasourceUrl:url.toString()});
 try{
  const campaign=await normal.campaign.findFirst();const title=campaign.title;let timeoutCode;
  try{await short.$transaction(async tx=>{await tx.campaign.update({where:{id:campaign.id},data:{title:'Should rollback'}});await tx.$queryRawUnsafe('SELECT pg_sleep(0.5)');});}catch(e){timeoutCode=e.meta?.code}
  const after=await normal.campaign.findUnique({where:{id:campaign.id}});record('statement-cancellation-rollback',timeoutCode==='57014'&&after.title===title,{sqlState:timeoutCode,unchanged:after.title===title});
  let release,ready;const released=new Promise(resolve=>release=resolve);const acquired=new Promise(resolve=>ready=resolve);
  const holder=normal.$transaction(async tx=>{await tx.$executeRaw`SELECT id FROM campaigns WHERE id=${campaign.id}::uuid FOR UPDATE`;ready();await released;});
  await acquired;let lockCode;try{await short.$executeRaw`UPDATE campaigns SET title='Should not write' WHERE id=${campaign.id}::uuid`;}catch(e){lockCode=e.meta?.code}finally{release();await holder}
  record('lock-wait-bounded',lockCode==='55P03',{sqlState:lockCode});
  const success=await short.$queryRawUnsafe('SELECT 1 AS ok');record('client-recovers-after-sql-timeout',success[0].ok===1,{ok:success[0].ok});
 }finally{await short.$disconnect()}
 const poolUrl=new URL(process.env.DATABASE_URL);poolUrl.searchParams.set('connection_limit','1');poolUrl.searchParams.set('pool_timeout','1');poolUrl.searchParams.set('options','-c statement_timeout=3000');
 const single=new PrismaService({datasourceUrl:poolUrl.toString()});
 try{await single.$connect();const first=single.$executeRawUnsafe('SELECT pg_sleep(1.5)').then(()=>true);await new Promise(resolve=>setTimeout(resolve,100));let code;try{await single.$queryRawUnsafe('SELECT 1')}catch(e){code=e.code}await first;const recovered=await single.$queryRawUnsafe('SELECT 1 AS ok');record('pool-acquisition-bounded-and-recovers',code==='P2024'&&recovered[0].ok===1,{code,recovered:recovered[0].ok===1});}finally{await single.$disconnect()}
 fs.writeFileSync(process.argv[2],JSON.stringify({at:new Date().toISOString(),environment:'isolated-qa',tests},null,2));if(tests.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error('Timeout QA failed:',e.code||e.name);process.exitCode=1}).finally(()=>normal.$disconnect());
