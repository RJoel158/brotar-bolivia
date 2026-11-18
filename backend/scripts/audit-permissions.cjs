// Read-only privilege and reward constraint inventory; never prints data or connection strings.
const {PrismaClient}=require('@prisma/client');const fs=require('node:fs');const db=new PrismaClient();
(async()=>{
 const tables=await db.$queryRaw`SELECT c.relname AS name, pg_get_userbyid(c.relowner) AS owner,
 has_schema_privilege(current_user,'public','USAGE') AS schema_usage,
 has_table_privilege(current_user,c.oid,'SELECT') AS can_select,
 has_table_privilege(current_user,c.oid,'INSERT') AS can_insert,
 has_table_privilege(current_user,c.oid,'UPDATE') AS can_update,
 has_table_privilege(current_user,c.oid,'DELETE') AS can_delete
 FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`;
 const constraints=await db.$queryRaw`SELECT c.conname AS name,c.contype AS type,pg_get_constraintdef(c.oid) AS definition
 FROM pg_constraint c WHERE c.conrelid IN ('public.campaign_rewards'::regclass,'public.contributions'::regclass) ORDER BY c.conname`;
 const missing=tables.filter(t=>!t.schema_usage||!t.can_select||!t.can_insert||!t.can_update).map(t=>t.name);
 const report={at:new Date().toISOString(),scope:'configured database, metadata only',tables,constraints,missingReadWritePrivileges:missing};
 fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));
 console.log(JSON.stringify({tables:tables.length,missingReadWritePrivileges:missing,constraints:constraints.length}));
 if(missing.length)process.exitCode=1;
})().catch(e=>{console.error('Permission audit failed:',e.code||e.name);process.exitCode=1}).finally(()=>db.$disconnect());
