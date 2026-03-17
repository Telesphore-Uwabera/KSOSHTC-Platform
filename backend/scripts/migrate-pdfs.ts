import admin from "firebase-admin";
import path from "node:path";
import fs from "node:fs";

// Initialize with local service account
const credPath = "c:\\Users\\uwabe\\Desktop\\KSOHTC-Platform\\backend\\lib\\firebase-service-account.json";
const cred = JSON.parse(fs.readFileSync(credPath, "utf-8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(cred),
  });
}

const db = admin.firestore();

async function migrate() {
  console.log("--- PDF URL MIGRATION START ---");
  const coursesSnap = await db.collection("courses").get();
  
  for (const courseDoc of coursesSnap.docs) {
    const courseId = courseDoc.id;
    console.log(`Auditing Course: ${courseId}`);
    
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    for (const modDoc of modulesSnap.docs) {
      const lessonsSnap = await db.collection("courses").doc(courseId).collection("modules").doc(modDoc.id).collection("lessons").get();
      
      for (const lessonDoc of lessonsSnap.docs) {
        const data = lessonDoc.data();
        const pdfUrl = data.pdfUrl || "";
        
        if (pdfUrl && !pdfUrl.startsWith("http")) {
          console.log(`  [LOCAL_PATH] Found: "${data.title}" -> ${pdfUrl}`);
          
          // Attempt to find a Cloudinary match by title or filename in ANY other lesson that might have been updated
          // This is a "self-healing" migration. 
          // If we can't find it, we'll keep it for the Smart Redirector as a fallback.
        } else if (pdfUrl.startsWith("http")) {
            // console.log(`  [OK] Absolute URL: "${data.title}"`);
        }
      }
    }
  }
  console.log("--- MIGRATION PRE-CHECK COMPLETE ---");
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
