
const nodemailer = require("nodemailer");
const path = require("node:path");
const fs = require("node:fs");

// Simple function to parse .env file since we can't rely on dotenv easily in a standalone script
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  content.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });
  return env;
}

const env = loadEnv(path.resolve(process.cwd(), "backend", ".env"));

async function testEmail() {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || user;
  const to = "kigalisafetyoshtrainingcenter@gmail.com"; 

  console.log("Config:", { host, port, user, pass: pass ? "****" : "missing", from });

  if (!host || !user || !pass) {
    console.error("Missing SMTP config in backend/.env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");

    console.log(`Sending test email to ${to}...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject: "[TEST] KSOHTC Email Test",
      text: "This is a test email from the KSOHTC platform verification script.",
      html: "<b>This is a test email from the KSOHTC platform verification script.</b>",
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Email test failed:");
    console.error(error);
  }
}

testEmail();
