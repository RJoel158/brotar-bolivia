require('reflect-metadata');
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const {NestFactory}=require('@nestjs/core');const {JwtService}=require('@nestjs/jwt');
const {AppModule}=require('../dist/app.module');const {PrismaService}=require('../dist/shared/persistence/prisma.service');
(async()=>{
 const u=new URL(process.env.DATABASE_URL||'');if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('Isolated QA database required');
 const runId=new Date().toISOString().replace(/[:.]/g,'-');
 const dir=process.argv[2],exe=process.argv[3];fs.mkdirSync(dir,{recursive:true});
 const app=await NestFactory.createApplicationContext(AppModule,{logger:false});const db=app.get(PrismaService);
 const user=await db.users.findFirst({where:{role:'sponsor'}});const campaign=await db.campaign.findFirst({where:{status:'published'}});
 const catalogCount=await db.campaign.count({where:{status:'published'}});
 const token=app.get(JwtService).sign({sub:user.id,email:user.email,role:user.role,kycStatus:user.kyc_status});
 await app.close();
 const profile=process.env.QA_PROFILE==='home'?[[1000,'20s','1000-home'],[10,'10s','home-recovery']]:process.env.QA_PROFILE==='recovery-only'?[[10,'10s','paged-post-stress-recovery']]:process.env.QA_PROFILE==='catalog-reverse'?[[1000,'20s','1000-paged-reverse'],[1000,'20s','1000-legacy-reverse']]:process.env.QA_PROFILE==='catalog-compare'?[[500,'20s','500-legacy-comparison'],[500,'20s','500-paged-comparison'],[1000,'20s','1000-legacy-comparison'],[1000,'20s','1000-paged-comparison'],[10,'10s','paged-recovery']]:process.env.QA_PROFILE==='harness-smoke'?[[1,'2s','harness-smoke']]:process.env.QA_PROFILE==='final'?[[500,'20s','500-final-ramp']]:process.env.QA_PROFILE==='realistic'?[[1000,'30s','1000-think3']]:process.env.QA_PROFILE==='ramp'?[[500,'20s','500-ramp'],[1000,'20s','1000-ramp'],[10,'20s','recovery-ramp']]:process.env.QA_PROFILE==='capacity'?[[250,'20s','250-vus'],[500,'20s','500-vus'],[1000,'20s','1000-monitored'],[100,'60s','endurance-100-vus'],[10,'20s','recovery-monitored']]:[[10,'20s','10-vus'],[100,'20s','100-vus'],[1000,'20s','1000-vus'],[10,'20s','recovery']];
 for(const [vus,duration,label] of profile){
  const summary=path.join(dir,`${runId}-load-${label}.json`);let output='';const started=new Date().toISOString();
  const env={USERPROFILE:process.env.USERPROFILE,APPDATA:process.env.APPDATA,LOCALAPPDATA:process.env.LOCALAPPDATA,PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,TEMP:process.env.TEMP,TMP:process.env.TMP,BASE_URL:'http://127.0.0.1:3100',QA_ISOLATED:'true',QA_TOKEN:token,CAMPAIGN_ID:campaign.id,VUS:String(vus),DURATION:duration,CATALOG_COUNT:String(catalogCount),RAMP:['ramp','realistic','final','catalog-compare','catalog-reverse','home'].includes(process.env.QA_PROFILE)?'true':'false',CATALOG_MODE:label.includes('home')?'home':label.includes('paged')?'paged':'legacy',THINK_TIME:process.env.QA_PROFILE==='realistic'?'3':'1'};
  const child=spawn(exe,['run','--quiet','--summary-export',summary,path.resolve('../k6/scripts/brotar-read-load.js')],{env,windowsHide:true});
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
  fs.writeFileSync(path.join(dir,`${runId}-load-${label}.log`),output);
  const metrics=JSON.parse(fs.readFileSync(summary,'utf8')).metrics;
  const value=(name,key)=>metrics[name]?.[key]??metrics[name]?.values?.[key];
  const latency=metrics.http_req_duration?.values||metrics.http_req_duration;
  const report=`# Carga HTTP: ${label}

- Fecha UTC: ${started}. Agente: Codex. Proyecto: Brotar.
- Entorno: PostgreSQL 17.6 local 127.0.0.1:55432/brotar_qa; Nest compilado :3100. Generador, API y BD comparten equipo Windows, 18 CPU lógicas, 15.6 GB RAM.
- Datos: 1.001 usuarios y ${catalogCount} campañas sintéticas; perfil de un patrocinador. No datos personales ni BD remota bajo carga.
- Configuración: ${vus} usuarios virtuales, ${duration}, pausa de ${env.THINK_TIME} segundos; mezcla 50% perfil, 30% detalle, 20% catálogo. Una petición por iteración. No equivale a ${vus} peticiones simultáneas ni a usuarios distintos.
- Catalogo: ${env.CATALOG_MODE}; lectura de ${env.CATALOG_MODE==='home'?'resumen global Home':env.CATALOG_MODE==='paged'?'24 filas por pagina':'lista completa legacy'}.
- Rampa: ${['ramp','realistic','final','catalog-compare','catalog-reverse','home'].includes(process.env.QA_PROFILE)?'10 s de subida y 5 s de bajada; hold indicado arriba':'sin rampa: escalon instantaneo, puede saturar aceptacion TCP'}.
- Código de salida k6: ${code}.

## Resultados

- Peticiones: ${value('http_reqs','count')}; tasa: ${value('http_reqs','rate')} req/s.
- Duración HTTP ms: ${JSON.stringify(latency)}.
- Errores HTTP: ${value('http_req_failed','value')??value('http_req_failed','rate')}.
- Checks: ${JSON.stringify(metrics.checks)}.
- Evidencia: [[${runId}-load-${label}.json]] y [[${runId}-load-${label}.log]].

## Criterios y hallazgos

Umbrales propuestos para diagnóstico: p95 < 1.000 ms, errores < 1%, checks > 99%; parada anticipada después de 10 s si falla latencia o errores. No son SLO acordados. Revisar código de salida, métricas y umbrales del JSON; un fin normal no demuestra capacidad de producción.

## Mejoras, límites y siguiente paso

Comparar escalones y recuperación para detectar saturación. El catálogo carece de paginación y su coste crece con datos; diseñar contrato paginado conservando búsqueda/orden y resultados. Faltan distribución de generadores, RTT remoto, muchos usuarios diferentes, escrituras y duración prolongada; esta prueba no certifica 1.000 usuarios en AlwaysData. No se instrumentaron CPU/IO ni event loop durante esta corrida.

## Reproducción

Script: k6/scripts/brotar-read-load.js. Runner: backend/scripts/run-qa-load.cjs, con DATABASE_URL apuntando exclusivamente a la BD local aislada. QA_TOKEN se genera en memoria, no se guarda. Los IDs son sintéticos. Para ejecutar, pnpm exec node scripts/run-qa-load.cjs <directorio-reportes> <ruta-k6.exe>.
`;
  fs.writeFileSync(path.join(dir,`${runId}-Carga-${label}.md`),report);
  console.log(JSON.stringify({label,code,requests:value('http_reqs','count'),latency}));
  if(code!==0&&![99,108].includes(code))break;
 }
})().catch(e=>{console.error('Load runner failed:',e.code||e.name);process.exitCode=1});
