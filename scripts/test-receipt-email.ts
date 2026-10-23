import path from "node:path";
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });
import { sendReceiptEmail } from "../backend/lib/notify";

async function run() {
  console.log("Testing Brevo with automatic SMTP fallback:");

  try {
    await sendReceiptEmail({
      to: "ksoshtc@gmail.com",
      payerName: "Test Student",
      receiptNo: "KSOSHTC/REC/2026/001",
      amount: 150000,
      currency: "RWF",
      packageName: "Construction Safety"
    });
    console.log("Receipt email call finished");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    process.exit(0);
  }
}
run();
