// Does not print connection strings, row contents or raw database errors.
const { PrismaClient, Prisma } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  let failures = 0;
  try {
    for (const model of Prisma.dmmf.datamodel.models) {
      try {
        // Selecting the complete scalar shape detects missing columns as well as tables/grants.
        await db[model.name[0].toLowerCase() + model.name.slice(1)].findFirst();
        console.log(`OK ${model.dbName || model.name}`);
      } catch (error) {
        failures++;
        console.log(`FAIL ${model.dbName || model.name}: ${error.code || error.name}`);
      }
    }
    if (failures) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
})().catch(() => { console.error('Database check failed'); process.exitCode = 1; });
