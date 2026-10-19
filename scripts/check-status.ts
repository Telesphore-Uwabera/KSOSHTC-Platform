import path from "node:path";
import { config } from "dotenv";
import { MongoClient } from "mongodb";

config({ path: path.resolve(process.cwd(), "backend", ".env") });

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "ksoshtc");
  const users = await db
    .collection("users")
    .find({ id: { $ne: "admin" } })
    .sort({ createdAt: 1 })
    .project({
      id: 1,
      name: 1,
      email: 1,
      sector: 1,
      idCardNo: 1,
      admissionBatch: 1,
      totalFees: 1,
      paymentAmount: 1,
      balanceFee: 1,
      createdAt: 1,
    })
    .toArray();

  console.log("Total learners:", users.length);
  console.log("First 5 learners:", JSON.stringify(users.slice(0, 5), null, 2));
  console.log("Sample of last 5 learners:", JSON.stringify(users.slice(-5), null, 2));
  await client.close();
}

check().catch(console.error);
