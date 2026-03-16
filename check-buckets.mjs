import { createRequire } from "module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "backend/.env") });

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const absPath = path.resolve(__dirname, "backend", credPath.replace(/['"]/g, ''));
const cred = JSON.parse(fs.readFileSync(absPath, "utf8"));

const app = initializeApp({ credential: cert(cred) });
const storage = getStorage(app);

async function checkBuckets() {
  try {
    const defaultBucket = `${cred.project_id}.appspot.com`;
    const newBucket = `${cred.project_id}.firebasestorage.app`;
    
    console.log(`Checking ${defaultBucket}...`);
    const [exists1] = await storage.bucket(defaultBucket).exists();
    console.log(`  Exists: ${exists1}`);
    
    console.log(`Checking ${newBucket}...`);
    const [exists2] = await storage.bucket(newBucket).exists();
    console.log(`  Exists: ${exists2}`);
    
    console.log("Listing all buckets:");
    // Underlying Google Cloud Storage client
    const [buckets] = await storage.bucket(defaultBucket).storage.getBuckets();
    buckets.forEach(b => console.log('  - ' + b.name));
  } catch (err) {
    console.error("Error checking buckets:", err);
  }
}

checkBuckets();
