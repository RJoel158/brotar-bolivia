// Sequential read-only baseline. No response bodies, SQL parameters or tokens are saved.
require('reflect-metadata');
const { performance } = require('node:perf_hooks');
const os = require('node:os');
const fs = require('node:fs');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { AppModule } = require('../dist/app.module');
const { PrismaService } = require('../dist/shared/persistence/prisma.service');
const { execFileSync } = require('node:child_process');
const percentile = (xs, p) => [...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1];
(async () => {
  let app;
  const report = {
    startedAt: new Date().toISOString(),
    commit: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    dirty: Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),
    environment: {node: process.version, platform: process.platform, cpuCount: os.cpus().length,
      totalMemoryGB: +(os.totalmem()/1024**3).toFixed(1), server: 'temporary local Nest instance', database: 'configured shared remote database'},
    concurrency: 1, samplesPerEndpoint: 5, measurements: [],
  };
  try {
    app = await NestFactory.create(AppModule,{logger:false});
    await app.listen(0,'127.0.0.1');
    const base = await app.getUrl();
    const db = app.get(PrismaService);
    let spans = [];
    // Temporary wrappers on this isolated instance; includes full Prisma call wall time.
    for (const model of require('@prisma/client').Prisma.dmmf.datamodel.models) {
      const delegate = db[model.name[0].toLowerCase()+model.name.slice(1)];
      for (const action of ['findFirst','findMany','findUnique','count','aggregate']) {
        const original = delegate[action].bind(delegate);
        delegate[action] = async (...args) => {
          const start=performance.now();
          try {return await original(...args);} finally {
            spans.push({model:model.name,action,durationMs:+(performance.now()-start).toFixed(2)});
          }
        };
      }
    }
    const user = await db.users.findFirst({where:{status:'active'},select:{id:true,email:true,role:true,kyc_status:true}});
    const campaign = await db.campaign.findFirst({where:{status:'published'},select:{id:true}});
    const jwt = user && app.get(JwtService).sign({sub:user.id,email:user.email,role:user.role,kycStatus:user.kyc_status});
    const cases = [{label:'catalog',path:'/campaigns'}, {label:'anonymous-profile',path:'/users/me',expected:401}];
    if(jwt) cases.push({label:'authenticated-profile',path:'/users/me',token:jwt});
    if(campaign) cases.push({label:'campaign-detail',path:'/campaigns/'+campaign.id});
    for(const c of cases) {
      const samples=[];
      for(let i=0;i<5;i++) {
        spans=[];
        const start=performance.now();
        try {
          const response=await fetch(base+c.path,{headers:c.token?{Authorization:'Bearer '+c.token}:{},signal:AbortSignal.timeout(15000)});
          const body=await response.arrayBuffer();
          samples.push({durationMs:+(performance.now()-start).toFixed(2),status:response.status,expectedStatus:c.expected||200,bytes:body.byteLength,prismaOperations:spans.slice()});
        }catch(error){samples.push({durationMs:+(performance.now()-start).toFixed(2),error:error.name,prismaOperations:spans.slice()});}
      }
      const times=samples.map(s=>s.durationMs);
      report.measurements.push({endpoint:c.label,samples,p50Ms:percentile(times,.5),p95Ms:percentile(times,.95),p99Ms:percentile(times,.99),failures:samples.filter(s=>s.error||s.status!==s.expectedStatus).length});
    }
    const pings=[];
    for(let i=0;i<5;i++){const start=performance.now();await db.$queryRaw`SELECT 1`;pings.push(+(performance.now()-start).toFixed(2));}
    report.databaseRoundTripMs=pings;
    report.finishedAt=new Date().toISOString();
    const json=JSON.stringify(report,null,2);
    if(process.argv[2])fs.writeFileSync(process.argv[2],json,'utf8');
    console.log(json);
  } finally {if(app)await app.close();}
})().catch(e=>{console.error('Baseline failed:',e.code||e.name);process.exitCode=1;});
