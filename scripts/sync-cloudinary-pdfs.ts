import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";

// Initialize Firebase
const credPath = "c:\\Users\\uwabe\\Desktop\\KSOHTC-Platform\\ksohtc-188e5-firebase-adminsdk-fbsvc-42b83ed154.json";
const cred = JSON.parse(fs.readFileSync(credPath, "utf-8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(cred),
  });
}

const db = admin.firestore();

// Cloudinary Config (from .env)
cloudinary.config({
  cloud_name: 'dnlatyl5z',
  api_key: '531793435626149',
  api_secret: 'E92nCg5QzQEuh7yl4kXnL35yoKo',
  secure: true
});

async function syncCloudinary() {
  console.log("--- STARTING CLOUDINARY SYNC ---");
  
  // 1. Fetch all resources from Cloudinary under ksohtc/courses/
  console.log("Fetching Cloudinary assets...");
  let assets = [];
  try {
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ksohtc/courses/',
      max_results: 500
    });
    assets = resources.resources;
  } catch (e) {
    console.error("Cloudinary error:", e.message);
    process.exit(1);
  }

  console.log(`Found ${assets.length} assets in Cloudinary.`);

  // 2. Audit Firestore
  const coursesSnap = await db.collection("courses").get();
  let updateCount = 0;
  let totalChecked = 0;

  for (const courseDoc of coursesSnap.docs) {
    const courseId = courseDoc.id;
    console.log(`Processing Course: ${courseId}`);
    
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    for (const modDoc of modulesSnap.docs) {
      const lessonsSnap = await db.collection("courses").doc(courseId).collection("modules").doc(modDoc.id).collection("lessons").get();
      
      for (const lessonDoc of lessonsSnap.docs) {
        totalChecked++;
        const data = lessonDoc.data();
        const rawTitle = (data.title || "").toLowerCase();
        const cleanTitle = rawTitle.replace(/[^a-z0-9]/g, "");
        const currentPdf = data.pdfUrl || "";

        // Strategy 1: Match by alphanumeric title
        let match = assets.find(a => {
            const publicId = a.public_id.toLowerCase().replace(/[^a-z0-9]/g, "");
            return publicId.endsWith(cleanTitle) || publicId.includes(cleanTitle);
        });

        // Strategy 2: If current pdf is relative, match by filename
        if (!match && currentPdf && !currentPdf.startsWith("http")) {
            const filename = path.basename(currentPdf).toLowerCase().replace(/[^a-z0-9]/g, "");
            match = assets.find(a => {
                const publicId = a.public_id.toLowerCase().replace(/[^a-z0-9]/g, "");
                return publicId.includes(filename);
            });
        }

        if (match) {
          const newUrl = match.secure_url;
          if (newUrl !== currentPdf) {
            console.log(`  [MAPPED] "${data.title}" -> ${newUrl}`);
            await lessonDoc.ref.update({ pdfUrl: newUrl });
            updateCount++;
          }
        } else {
            // console.log(`  [SKIP] No match for "${data.title}" (Current: ${currentPdf})`);
        }
      }
    }
  }

  console.log(`\nResults:`);
  console.log(`- Lessons checked: ${totalChecked}`);
  console.log(`- URLs Updated to Cloudinary: ${updateCount}`);
  console.log("--- SYNC COMPLETE ---");
}

syncCloudinary().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
