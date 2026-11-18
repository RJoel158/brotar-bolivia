// Synthetic fixtures only. Refuses any database other than the isolated loopback QA DB.
const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcrypt');
const {randomUUID,randomBytes}=require('node:crypto');
const u=new URL(process.env.DATABASE_URL||'');
if(u.hostname!=='127.0.0.1'||u.port!=='55432'||u.pathname!=='/brotar_qa')throw Error('QA database required');
const db=new PrismaClient();
(async()=>{
 const password=randomBytes(24).toString('hex');
 const hash=await bcrypt.hash(password,10);
 const owner=await db.users.create({data:{email:`creator-${randomUUID()}@example.test`,full_name:'Creador QA Sintetico',password_hash:hash,role:'creator',kyc_status:'verified'}});
 const sponsors=Array.from({length:1000},(_,i)=>({id:randomUUID(),email:`qa-${i}-${randomUUID()}@example.test`,full_name:`Patrocinador QA ${i}`,password_hash:hash,role:'sponsor',kyc_status:'verified'}));
 await db.users.createMany({data:sponsors});
 const campaigns=Array.from({length:100},(_,i)=>({id:randomUUID(),owner_user_id:owner.id,title:`Bosque QA ${i}`,slug:`qa-${randomUUID()}`,category:'ambiental',campaign_type:'donation',funding_model:'all_or_nothing',goal_amount:10000,status:'published',short_summary:'Campaña sintética para medir capacidad sin usar datos personales.',end_date:new Date('2030-01-01')}));
 await db.campaign.createMany({data:campaigns});
 console.log(JSON.stringify({users:1001,campaigns:100,personalData:false}));
})().finally(()=>db.$disconnect());
