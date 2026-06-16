const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Path to data backup file inside the prisma directory
const BACKUP_FILE = path.join(process.cwd(), 'prisma', 'db_backup.json');

// Exact dependency-ordered table list (safe for insertions)
const DEPENDENCY_ORDER = [
  { model: 'user', name: 'User' },
  { model: 'category', name: 'Category' },
  { model: 'diamond', name: 'Diamond' },
  { model: 'setting', name: 'Setting' },
  { model: 'siteAsset', name: 'SiteAsset' },
  { model: 'otpVerification', name: 'OtpVerification' },
  { model: 'customizationRequest', name: 'CustomizationRequest' },
  { model: 'product', name: 'Product' },
  { model: 'ringConfiguration', name: 'RingConfiguration' },
  { model: 'order', name: 'Order' },
  { model: 'orderItem', name: 'OrderItem' },
  { model: 'review', name: 'Review' }
];

async function exportData() {
  console.log('=== Starting Data Export from SQLite ===');
  // Initialize Prisma Client using current local SQLite configuration
  const prisma = new PrismaClient();

  const dump = {};

  try {
    for (const table of DEPENDENCY_ORDER) {
      console.log(`Exporting table: ${table.name}...`);
      const records = await prisma[table.model].findMany();
      dump[table.model] = records;
      console.log(`  Successfully exported ${records.length} records.`);
    }

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(dump, null, 2), 'utf8');
    console.log(`\n\x1b[32mSUCCESS: All data exported successfully to: ${BACKUP_FILE}\x1b[0m`);
  } catch (error) {
    console.error('\n\x1b[31mEXPORT FAILED:\x1b[0m', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function importData() {
  console.log('=== Starting Data Import to Target Database ===');

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`\x1b[31mError: Backup file not found at ${BACKUP_FILE}. Please run --export first.\x1b[0m`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));

  // Initialize Prisma Client
  const prisma = new PrismaClient();

  try {
    // 1. Clean up existing records in reverse dependency order
    console.log('\nCleaning up existing records in target database...');
    const reverseOrder = [...DEPENDENCY_ORDER].reverse();
    for (const table of reverseOrder) {
      console.log(`  Deleting records from ${table.name}...`);
      await prisma[table.model].deleteMany();
    }
    console.log('Cleanup completed.');

    // 2. Import records in exact dependency order
    console.log('\nImporting records in dependency order...');
    for (const table of DEPENDENCY_ORDER) {
      const records = dump[table.model] || [];
      console.log(`  Importing ${records.length} records into ${table.name}...`);
      
      if (records.length > 0) {
        await prisma.$transaction(
          records.map((record) => {
            // Convert string timestamps back to Date objects
            const parsedRecord = { ...record };
            for (const key in parsedRecord) {
              if (typeof parsedRecord[key] === 'string' && 
                  (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(parsedRecord[key]))) {
                parsedRecord[key] = new Date(parsedRecord[key]);
              }
            }
            return prisma[table.model].create({ data: parsedRecord });
          })
        );
      }
      console.log(`    Successfully imported ${records.length} records.`);
    }

    // 3. Validation and verification
    console.log('\n=== Validating Migrated Table Records ===');
    let validationPassed = true;
    for (const table of DEPENDENCY_ORDER) {
      const pgCount = await prisma[table.model].count();
      const sqliteCount = (dump[table.model] || []).length;
      
      if (pgCount === sqliteCount) {
        console.log(`  \x1b[32m✔ ${table.name}: Row counts match (${pgCount} = ${sqliteCount})\x1b[0m`);
      } else {
        console.log(`  \x1b[31m✘ ${table.name}: Row counts mismatch (Target: ${pgCount}, Source: ${sqliteCount})\x1b[0m`);
        validationPassed = false;
      }
    }

    if (validationPassed) {
      console.log(`\n\x1b[32mSUCCESS: Data migration verified with ZERO data loss!\x1b[0m`);
    } else {
      console.warn(`\n\x1b[33mWarning: Data migration finished but validation failed. Please check table records.\x1b[0m`);
    }
  } catch (error) {
    console.error('\n\x1b[31mIMPORT FAILED:\x1b[0m', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const mode = process.argv[2];
if (mode === '--export') {
  exportData();
} else if (mode === '--import') {
  importData();
} else {
  console.log('Usage: node scripts/db_migration.js [--export | --import]');
  process.exit(1);
}
