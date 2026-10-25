import { MongoClient } from 'mongodb';

/**
 * Migration script to update legacy fee values (150000) to the new default (200000).
 * It updates the `users` and `receipts` collections.
 * Run with: `npx -y ts-node@latest scripts/update-fees.ts`
 */
async function run() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB?.trim() || 'ksoshtc';
  const db = client.db(dbName);

  const usersCol = db.collection('users');
  const receiptsCol = db.collection('receipts');

  // Update users collection fields
  const usersResult = await usersCol.updateMany(
    { $or: [{ totalFees: 150000 }, { paymentAmount: 150000 }, { balanceFee: 150000 }] },
    {
      $set: {
        totalFees: 200000,
        paymentAmount: 200000,
        balanceFee: 200000,
      },
    }
  );
  console.log('✅ Users updated:', usersResult.modifiedCount);

  // Update receipts collection fields
  const receiptsResult = await receiptsCol.updateMany(
    { $or: [{ dueFee: 150000 }, { receivedFee: 150000 }] },
    {
      $set: {
        dueFee: 200000,
        receivedFee: 200000,
      },
    }
  );
  console.log('✅ Receipts updated:', receiptsResult.modifiedCount);

  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
