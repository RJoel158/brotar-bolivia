// Read-only audit of the actual Nest dependency graph and its Prisma pool.
require('reflect-metadata');
const fs=require('node:fs');const {randomUUID}=require('node:crypto');
const {Logger}=require('@nestjs/common');Logger.overrideLogger(false);
const {Test}=require('@nestjs/testing');const {ModulesContainer}=require('@nestjs/core');
const {PrismaService}=require('../dist/shared/persistence/prisma.service');
// Prisma loads environment on import; the connection string is never printed.
const url=new URL(process.env.DATABASE_URL);
const tag='brotar-pool-audit-'+randomUUID();url.searchParams.set('application_name',tag);
process.env.DATABASE_URL=url.toString();
const {AppModule}=require('../dist/app.module');
(async()=>{
 let instances=0;const poolEvents=[];
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(PrismaService).useFactory({factory:()=>{
  instances++;const p=new PrismaService({log:[{level:'info',emit:'event'}]});
  p.$on('info',event=>{const match=event.message.match(/pool with (\d+) connections/i);if(match)poolEvents.push({maxConnections:Number(match[1])})});
  return p;
 }}).compile();
 try{
  await module.init();const db=module.get(PrismaService);const graph=module.get(ModulesContainer);const providers=[];const consumers=[];
  for(const m of graph.values())for(const [token,wrapper] of m.providers){if(token===PrismaService)providers.push({module:m.metatype?.name,sameInstance:wrapper.instance===db});const instance=wrapper.instance;if(instance&&typeof instance==='object'&&'prisma'in instance)consumers.push({name:wrapper.metatype?.name||String(token),sameInstance:instance.prisma===db});}
  for(let i=0;i<3;i++)await db.$queryRaw`SELECT 1`;
  const sequential=await db.$queryRaw`SELECT count(*)::int AS connections FROM pg_stat_activity WHERE application_name=${tag}`;
  await Promise.all(Array.from({length:3},()=>db.$queryRaw`SELECT 1`));
  const parallel=await db.$queryRaw`SELECT count(*)::int AS connections FROM pg_stat_activity WHERE application_name=${tag}`;
  const serverSettings=await db.$queryRaw`SELECT name, setting, unit FROM pg_settings WHERE name IN ('max_connections','statement_timeout','lock_timeout','idle_in_transaction_session_timeout') ORDER BY name`;
  const roleLimit=await db.$queryRaw`SELECT rolconnlimit AS connection_limit FROM pg_roles WHERE rolname=current_user`;
  const report={serverSettings,roleLimit,at:new Date().toISOString(),scope:'one Nest application context, read-only remote database',instancesConstructed:instances,providers,consumers,poolEvents,explicitParameters:{connection_limit:url.searchParams.get('connection_limit'),pool_timeout:url.searchParams.get('pool_timeout'),connect_timeout:url.searchParams.get('connect_timeout')},afterSequential:sequential,afterThreeParallel:parallel,passed:instances===1&&providers.length===1&&providers.every(x=>x.sameInstance)&&consumers.every(x=>x.sameInstance)};
  fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
 }finally{await module.close()}
})().catch(e=>{console.error('Pool audit failed:',e.code||e.name);process.exitCode=1});
