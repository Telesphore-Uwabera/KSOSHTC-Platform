import path from "node:path";
import { config as loadEnv } from "dotenv";
import { MongoClient } from "mongodb";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

const rawUri = process.env.MONGODB_URI?.trim();
if (!rawUri) {
  throw new Error("Missing MONGODB_URI in backend/.env");
}
const uri: string = rawUri;

const dbName =
  process.env.MONGODB_DB?.trim() ||
  (() => {
    try {
      const u = new URL(uri);
      return u.pathname?.replace(/^\//, "").trim() || "ksoshtc";
    } catch {
      return "ksoshtc";
    }
  })();

const SECTOR_ID_CODES: Record<string, string> = {
  "construction": "CONS",
  "mining": "MIN",
  "industrial-safety": "IND",
  "food-safety": "FOOD",
  "safety-management": "SM",
  "safe-lifting-operations": "LIFT",
  "fire-safety-and-egress": "FIRE",
  "esg": "ESG",
  "first-aid": "FA",
  "iso-45001": "ISO45",
  "iso-14011": "ISO14",
};

function getSectorCode(sector?: string): string {
  if (!sector) return "GEN";
  const s = sector.toLowerCase().trim();
  return SECTOR_ID_CODES[s] || s.slice(0, 4).toUpperCase();
}

async function migrate() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  
  const usersCol = db.collection("users");
  const receiptsCol = db.collection("receipts");

  const users = await usersCol.find({}).sort({ createdAt: 1 }).toArray();
  const receipts = await receiptsCol.find({}).toArray();

  // Create lookup for receipts by email or old idCardNo or name
  const receiptByEmail = new Map();
  const receiptByIdCard = new Map();
  const receiptByName = new Map();

  receipts.forEach(r => {
    if (r.payerEmail) receiptByEmail.set(r.payerEmail.toLowerCase().trim(), r);
    if (r.idCardNo) receiptByIdCard.set(r.idCardNo.trim(), r);
    if (r.receivedFrom) receiptByName.set(r.receivedFrom.toLowerCase().trim(), r);
  });

  const sectorCounters: Record<string, number> = {};

  console.log(`Starting migration for ${users.length} users...`);

  let migratedCount = 0;
  for (const u of users) {
    if (u.id === "admin") continue;

    const year = u.createdAt ? new Date(u.createdAt).getFullYear() : 2026;
    const secCode = getSectorCode(u.sector);
    const counterKey = `${year}-${secCode}`;
    sectorCounters[counterKey] = (sectorCounters[counterKey] || 0) + 1;
    const seq = sectorCounters[counterKey];
    const newStudentId = `${year}-${secCode}-${String(seq).padStart(3, "0")}`;

    // Find linked receipt if any
    const r = (u.email && receiptByEmail.get(u.email.toLowerCase().trim())) ||
              (u.idCardNo && receiptByIdCard.get(u.idCardNo.trim())) ||
              (u.name && receiptByName.get(u.name.toLowerCase().trim()));

    const invNo = u.invoiceNo || (r ? r.invoiceId : `${5000 + seq}`);
    const regNo = u.registrationNo || (r ? r.invoiceId : `${5000 + seq}`);
    const totalFees = u.totalFees !== undefined ? u.totalFees : (r ? (r.dueFee || r.receivedFee || 200000) : 200000);
    const payment = u.paymentAmount !== undefined ? u.paymentAmount : (r ? r.receivedFee : (u.approved ? 200000 : 0));
    const balance = u.balanceFee !== undefined ? u.balanceFee : Math.max(0, totalFees - payment);
    const academicYear = u.academicYear || `${year}-${year + 1}`;
    const admissionBatch = "EMMANUEL NIYOBUHUNGIRO";
    const admissionTakenBy = u.admissionTakenBy || (seq % 2 === 0 ? "SUBHASH KUMAR" : "Dipali Kumari Agarwal");

    const updateFields: any = {
      idCardNo: newStudentId,
      invoiceNo: invNo,
      registrationNo: regNo,
      totalFees,
      paymentAmount: payment,
      balanceFee: balance,
      academicYear,
      admissionBatch,
      admissionTakenBy,
    };

    if (!u.phone && r?.payerPhone) {
      updateFields.phone = r.payerPhone;
    }

    await usersCol.updateOne({ id: u.id }, { $set: updateFields });

    // Also update any receipt that references this user
    await receiptsCol.updateMany(
      {
        $or: [
          { idCardNo: u.idCardNo },
          { idCardNo: newStudentId },
          { invoiceId: invNo },
          ...(u.email ? [{ payerEmail: u.email.toLowerCase().trim() }] : []),
        ],
      },
      {
        $set: {
          idCardNo: newStudentId,
          signatoryName: "Emmanuel NIYOBUHUNGIRO",
        },
      }
    );

    migratedCount++;
    console.log(`Updated ${u.name} (${u.sector || "GEN"}) -> Student ID: ${newStudentId}, Batch: EMMANUEL NIYOBUHUNGIRO`);
  }

  console.log(`\nMigration completed successfully for ${migratedCount} learners!`);
  await client.close();
}

migrate().catch(console.error);
