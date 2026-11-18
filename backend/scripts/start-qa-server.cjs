require('reflect-metadata');
const fs=require('node:fs');const {performance,monitorEventLoopDelay}=require('node:perf_hooks');
const {AsyncLocalStorage}=require('node:async_hooks');const {randomUUID}=require('node:crypto');
const {NestFactory}=require('@nestjs/core');const {ValidationPipe}=require('@nestjs/common');
const {AppModule}=require('../dist/app.module');const {PrismaService}=require('../dist/shared/persistence/prisma.service');
const u=new URL(process.env.DATABASE_URL||'');if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('Isolated QA required');
(async()=>{
 const app=await NestFactory.create(AppModule,{logger:false,bodyParser:false});
 require('../dist/shared/http/configure-http').configureHttp(app);
 const context=new AsyncLocalStorage();const db=app.get(PrismaService);
 for(const model of require('@prisma/client').Prisma.dmmf.datamodel.models){const delegate=db[model.name[0].toLowerCase()+model.name.slice(1)];for(const action of ['findFirst','findMany','findUnique','count','aggregate']){const original=delegate[action].bind(delegate);delegate[action]=async(...args)=>{const start=performance.now();try{return await original(...args)}finally{const c=context.getStore();if(c){c.prismaMs+=performance.now()-start;c.operations++}}};}}
 const routes={};
 app.use((req,res,next)=>{const c={start:performance.now(),prismaMs:0,operations:0};res.setHeader('x-request-id',randomUUID());res.on('finish',()=>{const name=req.route?.path||'unmatched';const key=req.method+' '+name;const r=routes[key]||{count:0,errors:0,totalMs:0,prismaMs:0,operations:0,maxMs:0};const elapsed=performance.now()-c.start;r.count++;r.errors+=Number(res.statusCode>=500);r.totalMs+=elapsed;r.prismaMs+=c.prismaMs;r.operations+=c.operations;r.maxMs=Math.max(r.maxMs,elapsed);routes[key]=r});context.run(c,next)});
 const delay=monitorEventLoopDelay({resolution:20});delay.enable();let cpu=process.cpuUsage();let wall=performance.now();const samples=[];
 setInterval(async()=>{const now=performance.now();const usage=process.cpuUsage(cpu);const elapsed=now-wall;cpu=process.cpuUsage();wall=now;let database;try{database=await db.$queryRaw`SELECT count(*)::int AS connections, count(*) FILTER (WHERE state='active')::int AS active, count(*) FILTER (WHERE wait_event_type='Lock')::int AS waiting_locks FROM pg_stat_activity WHERE datname=current_database()`}catch{database='unavailable'}samples.push({at:new Date().toISOString(),cpuPercentOneCore:(usage.user+usage.system)/1000/elapsed*100,rssMB:process.memoryUsage().rss/1024**2,eventLoopP99Ms:delay.percentile(99)/1e6,database});delay.reset();fs.writeFileSync(process.argv[2],JSON.stringify({samples,routes},null,2));},2000).unref();
 await app.listen(3100,'127.0.0.1');console.log('Instrumented isolated QA listening on 3100');
})().catch(e=>{console.error(e.code||e.name);process.exitCode=1});
