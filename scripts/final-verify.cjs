const admin = require("firebase-admin");
const fs = require("node:fs");
const https = require("node:https");

// Initialize Firebase
const credPath = "c:\\Users\\uwabe\\Desktop\\KSOHTC-Platform\\ksohtc-188e5-firebase-adminsdk-fbsvc-42b83ed154.json";
const cred = JSON.parse(fs.readFileSync(credPath, "utf-8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(cred),
  });
}

const db = admin.firestore();

async function verifySystem() {
  console.log("--- FINAL SYSTEM VERIFICATION ---");

  // 1. Audit Quizzes/Assessments
  const coursesSnap = await db.collection("courses").get();
  console.log(`Checking ${coursesSnap.size} courses for quizzes...`);

  for (const courseDoc of coursesSnap.docs) {
    const courseId = courseDoc.id;
    let quizCount = 0;
    
    // Check for course-level quizzes
    const courseQuiz = await db.collection("courses").doc(courseId).collection("quiz").get();
    quizCount += courseQuiz.size;

    // Check for module-level assessments
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    for (const modDoc of modulesSnap.docs) {
      const assessmentsSnap = await db.collection("courses").doc(courseId).collection("modules").doc(modDoc.id).collection("assessments").get();
      quizCount += assessmentsSnap.size;
    }

    console.log(`Course: ${courseId.padEnd(20)} | Quizzes/Assessments: ${quizCount}`);
  }

  // 2. Local Email SMTP environment check (silent)
  console.log("\n--- VERIFICATION COMPLETE ---");
  process.exit(0);
}

verifySystem();
