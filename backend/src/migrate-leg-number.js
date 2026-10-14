/**
 * Migration: Binary position (LEFT/RIGHT) → Numeric legNumber (1/2)
 * Run once: node src/migrate-leg-number.js
 * Idempotent — safe to run multiple times.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  if (!MONGO_URI) {
    console.error('❌  No MONGODB_URI found in environment. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const collection = mongoose.connection.collection('employees');

  // Convert LEFT → legNumber: 1
  const leftResult = await collection.updateMany(
    { position: 'LEFT', legNumber: { $exists: false } },
    { $set: { legNumber: 1 }, $unset: { position: '' } }
  );
  console.log(`✅  LEFT → legNumber:1  →  ${leftResult.modifiedCount} documents updated`);

  // Convert RIGHT → legNumber: 2
  const rightResult = await collection.updateMany(
    { position: 'RIGHT', legNumber: { $exists: false } },
    { $set: { legNumber: 2 }, $unset: { position: '' } }
  );
  console.log(`✅  RIGHT → legNumber:2  →  ${rightResult.modifiedCount} documents updated`);

  // Set default legNumber:1 for any records that still have no legNumber (paranoia guard)
  const defaultResult = await collection.updateMany(
    { legNumber: { $exists: false } },
    { $set: { legNumber: 1 } }
  );
  console.log(`✅  Default legNumber:1  →  ${defaultResult.modifiedCount} documents updated`);

  console.log('\n🎉  Migration complete! All employees now have a numeric legNumber.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
