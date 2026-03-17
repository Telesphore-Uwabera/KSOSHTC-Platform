const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("node:path");
const fs = require("node:fs");

const serviceAccountPath = path.resolve(process.cwd(), "ksohtc-188e5-firebase-adminsdk-fbsvc-42b83ed154.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function auditAllCourses() {
  let output = "";
  const log = (msg) => {
      console.log(msg);
      output += msg + "\n";
  };

  try {
    const coursesSnap = await db.collection("courses").get();
    log(`Total courses: ${coursesSnap.size}`);

    for (const courseDoc of coursesSnap.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      log(`\n========================================`);
      log(`COURSE: ${courseId} (${courseData.title})`);
      log(`========================================`);

      const modules = await courseDoc.ref.collection("modules").get();
      for (const mod of modules.docs) {
        log(`\nModule: ${mod.id} (${mod.data().title})`);
        const lessons = await mod.ref.collection("lessons").get();
        lessons.forEach(l => {
            const d = l.data();
            const pdf = d.pdfUrl || "NONE";
            const status = pdf.startsWith("http") ? "[OK - Cloudinary]" : (pdf.startsWith("/") ? "[WARN - Relative]" : "[MISSING]");
            log(`  Lesson: ${l.id} | ${status} | Title: "${d.title}" | PDF: ${pdf}`);
        });
      }
    }
    
    fs.writeFileSync("audit_all_courses.txt", output, "utf8");
    console.log("\nDone. Results written to audit_all_courses.txt");
  } catch (err) {
    console.error("Error:", err);
  }
}

auditAllCourses();
