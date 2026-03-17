import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), "backend", ".env") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkMiningData() {
  console.log("--- MINING COURSE DOC ---");
  const course = await db.collection("courses").doc("mining").get();
  console.log(course.exists ? course.data() : "NOT FOUND");

  console.log("\n--- MINING QUIZ (Legacy) ---");
  const quiz = await db.collection("quizzes").doc("mining").get();
  console.log(quiz.exists ? quiz.data() : "NOT FOUND");

  console.log("\n--- MINING MODULES & LESSONS ---");
  const modules = await db.collection("courses").doc("mining").collection("modules").get();
  for (const mod of modules.docs) {
    console.log(`Module: ${mod.id} (${mod.data().title})`);
    const lessons = await mod.ref.collection("lessons").get();
    lessons.forEach(l => {
        const d = l.data();
        console.log(`  Lesson: ${l.id} | Title: "${d.title}" | PDF: ${d.pdfUrl || "NONE"}`);
    });
    const assessments = await mod.ref.collection("assessments").get();
    assessments.forEach(a => {
        console.log(`  Assessment: ${a.id} | Title: ${a.data().title}`);
    });
  }
}

checkMiningData();
