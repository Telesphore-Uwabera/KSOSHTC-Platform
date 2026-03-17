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

async function checkMiningData() {
  let output = "";
  const log = (msg) => {
      console.log(msg);
      output += msg + "\n";
  };

  try {
    log("--- MINING COURSE DOC ---");
    const course = await db.collection("courses").doc("mining").get();
    log(JSON.stringify(course.exists ? course.data() : "NOT FOUND", null, 2));

    log("\n--- MINING QUIZ (Legacy) ---");
    const quiz = await db.collection("quizzes").doc("mining").get();
    log(JSON.stringify(quiz.exists ? quiz.data() : "NOT FOUND", null, 2));

    log("\n--- MINING MODULES & LESSONS ---");
    const modules = await db.collection("courses").doc("mining").collection("modules").get();
    
    if (modules.empty) {
        log("No modules found for mining course.");
    }

    for (const mod of modules.docs) {
      log(`Module: ${mod.id} (${mod.data().title})`);
      const lessons = await mod.ref.collection("lessons").get();
      lessons.forEach(l => {
          const d = l.data();
          log(`  Lesson: ${l.id} | Title: "${d.title}" | PDF: ${d.pdfUrl || "NONE"}`);
      });
      const assessments = await mod.ref.collection("assessments").get();
      assessments.forEach(a => {
          log(`  Assessment: ${a.id} | Title: ${a.data().title}`);
      });
    }
    
    fs.writeFileSync("audit_mining_full.txt", output, "utf8");
    console.log("\nDone. Results written to audit_mining_full.txt");
  } catch (err) {
    console.error("Error:", err);
  }
}

checkMiningData();
