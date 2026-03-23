/**
 * Notifications: email to admin + optional Netlify form submission.
 * Firestore (registration, contact) is unchanged. Email is sent only after
 * data is successfully stored in Firestore (see postRegister / postContact).
 *
 * EMAIL FORMATS (plain text; HTML is auto-generated from newlines -> <br>):
 *
 * 1) New registration (to ADMIN):
 *    Subject: [KSOSHTC] New registration: {name}
 *    Body:
 *      A new learner has registered. Below are all the details they entered (stored in Firebase).
 *
 *      ——— Details of the registrant ———
 *      Full name: {name}
 *      Email: {email}
 *      Phone: {phone or "(not provided)"}
 *      Organization: {org or "(not provided)"}
 *      Sector: {sector or "(not provided)"}
 *      Registered at: {createdAt}
 *      ———
 *
 *      Approve or manage this user in your admin dashboard (Learners).
 *
 * 2) New contact (to ADMIN):
 *    Subject: [KSOSHTC] New contact: {name}
 *    Body:
 *      New message from the contact form.
 *
 *      ——— Sender ———
 *      Name: {name}
 *      Email: {email}
 *      Phone: {phone or "(not provided)"}
 *      ———
 *
 *      Message:
 *      {message}
 *
 * 3) Account approved (to LEARNER):
 *    Subject: [KSOSHTC] Your account has been approved
 *    Body:
 *      Hello {name},
 *
 *      Your payment has been confirmed and your KSOSHTC learning account has been approved.
 *
 *      Log in: {FRONTEND_URL}/login
 *
 *      — Kigali Safety & OSH Training Centre
 */

import nodemailer from "nodemailer";

/** Admin inbox for approvals and notifications (use ADMIN_EMAIL in .env; fallback for notifications). */
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim() || "ksoshtc@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://www.kigalisafetytraining.com";

/** Support line appended to every transactional email (plain + HTML with clickable WhatsApp). */
export const SUPPORT_PHONE_DISPLAY = "+250 785 072 512";
const SUPPORT_WHATSAPP_WA_ME = "https://wa.me/250785072512";

function emailSupportFooterText(): string {
  return [
    "",
    "—",
    "Questions or issues?",
    `WhatsApp (click to chat): ${SUPPORT_WHATSAPP_WA_ME}`,
    `Phone: ${SUPPORT_PHONE_DISPLAY}`,
  ].join("\n");
}

function emailSupportFooterHtml(): string {
  return `<p style="margin-top:1.25em;padding-top:1em;border-top:1px solid #e5e5e5;font-size:14px;color:#333;line-height:1.5;">Questions or issues?<br><a href="${SUPPORT_WHATSAPP_WA_ME}" style="color:#0d6efd;">Message us on WhatsApp</a> · ${SUPPORT_PHONE_DISPLAY}</p>`;
}

/** Build transporter from env (SMTP). If not configured, returns null and we skip email. */
function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const passRaw = process.env.SMTP_PASS?.trim();
  // Gmail app passwords are often copied with spaces for readability.
  const pass = host?.toLowerCase().includes("gmail") ? passRaw?.replace(/\s+/g, "") : passRaw;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

const fromAddress = (): string =>
  process.env.SMTP_FROM ?? process.env.SMTP_USER ?? ADMIN_EMAIL;

/** Send email to a single recipient. No-op if SMTP not configured. */
async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.log("[NOTIFY] SMTP not configured; skipping email:", subject);
    return;
  }
  const textBody = text.trimEnd() + "\n" + emailSupportFooterText();
  const htmlBody = (html ?? text.replace(/\n/g, "<br>\n")) + emailSupportFooterHtml();
  try {
    const info = await transport.sendMail({
      from: fromAddress(),
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.log("[NOTIFY] Email sent successfully:", subject, "to", to, "Response:", info.response);
  } catch (e) {
    console.error("[NOTIFY] Email failed dramatically:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.stack) console.error("[NOTIFY_STACK]", e.stack);
  }
}

/** Admin-only test function to verify SMTP connectivity. */
export async function testEmail(to: string): Promise<{ success: boolean; message: string }> {
  try {
    const transport = getTransporter();
    if (!transport) return { success: false, message: "SMTP not configured (HOST, USER, or PASS missing in .env)." };
    await transport.verify();
    await sendEmail(to, "[KSOSHTC] SMTP Test Connection", "Your SMTP configuration is working correctly!");
    return { success: true, message: `Test email sent to ${to}. Check inbox and SPAM folder.` };
  } catch (e) {
    console.error("[NOTIFY_TEST] SMTP Verify failed:", e);
    return { success: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Send email to admin. No-op if SMTP not configured. */
export async function sendAdminEmail(subject: string, text: string, html?: string): Promise<void> {
  if (!ADMIN_EMAIL) return;
  await sendEmail(ADMIN_EMAIL, subject, text, html);
}

/** Notify admin of new registration (call only after successful Firestore write). */
export async function notifyNewRegistration(data: {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  sector?: string;
  createdAt?: string;
}): Promise<void> {
  const subject = `[KSOSHTC] New registration: ${data.name}`;
  const phoneLine = data.phone ? `Phone: ${data.phone}` : "Phone: (not provided)";
  const lines = [
    "A new learner has registered. Below are all the details they entered (stored in Firebase).",
    "",
    "——— Details of the registrant ———",
    `Full name: ${data.name}`,
    `Email: ${data.email}`,
    phoneLine,
    `Organization: ${data.organization ?? "(not provided)"}`,
    `Sector: ${data.sector ?? "(not provided)"}`,
    `Registered at: ${data.createdAt ?? new Date().toISOString()}`,
    "———",
    "",
    "Approve or manage this user in your admin dashboard (Learners).",
  ];
  await sendAdminEmail(subject, lines.join("\n"));

  await submitToNetlifyForm("registration", {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    organization: data.organization ?? "",
    sector: data.sector ?? "",
  });
}

/** Notify learner after registration with payment instructions (approval happens after payment confirmation). */
export async function notifyLearnerRegistrationReceived(data: { name: string; email: string }): Promise<void> {
  const subject = "[KSOSHTC] Registration received — complete payment to activate your account";
  const lines = [
    `Hello ${data.name},`,
    "",
    "Thank you for registering with KSOSHTC.",
    "To proceed to account approval and start your course, please complete the payment below:",
    "",
    "Course fee: 10,000 FRW",
    "Mobile number (payment support): +250 7850 72512",
    "Bank: Equity Bank (CG account)",
    "Account number: 4003100607428",
    "Account name: Emmanuel NIYOBUHUNGIRO",
    "",
    "After payment confirmation, your account will be approved and you will receive access details.",
    "",
    "— Kigali Safety & OSH Training Centre",
  ];
  await sendEmail(data.email, subject, lines.join("\n"));
}

/** Notify admin of new contact form submission (call after Firestore write). */
export async function notifyNewContact(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<void> {
  const subject = `[KSOSHTC] New contact: ${data.name}`;
  const phoneLine = data.phone ? `Phone: ${data.phone}` : "Phone: (not provided)";
  const lines = [
    "New message from the contact form.",
    "",
    "——— Sender ———",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    phoneLine,
    "———",
    "",
    "Message:",
    data.message,
  ];
  await sendAdminEmail(subject, lines.join("\n"));

  await submitToNetlifyForm("contact", {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    message: data.message,
  });
}

/** Notify the learner that their account has been approved (call after setting approved: true). */
export async function notifyLearnerApproved(data: { name: string; email: string }): Promise<void> {
  const subject = "[KSOSHTC] Your account has been approved";
  const lines = [
    `Hello ${data.name},`,
    "",
    "Your payment has been confirmed and your KSOSHTC learning account has been approved.",
    "You can now log in and start your course:",
    `Log in: ${FRONTEND_URL}/login`,
    "",
    "— Kigali Safety & OSH Training Centre",
  ];
  await sendEmail(data.email, subject, lines.join("\n"));
}

/** Notify learner with a password reset link. */
export async function notifyPasswordReset(data: { name: string; email: string; token: string }): Promise<void> {
  const subject = "[KSOSHTC] Password Reset Request";
  const resetUrl = `${FRONTEND_URL}/reset-password/${data.token}`;
  const lines = [
    `Hello ${data.name},`,
    "",
    "We received a request to reset your password for your KSOSHTC account.",
    "Click the link below to set a new password. This link will expire in 1 hour.",
    "",
    `Reset password: ${resetUrl}`,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    "— Kigali Safety & OSH Training Centre",
  ];
  await sendEmail(data.email, subject, lines.join("\n"));
}

/** Notify admin when a learner submits assignment PDF (after Firestore + upload). */
export async function notifyAdminAssignmentSubmitted(data: {
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  assignmentTitle: string;
  submissionId: string;
}): Promise<void> {
  const subject = `[KSOSHTC] New assignment submission: ${data.assignmentTitle}`;
  const lines = [
    "A learner has submitted a PDF assignment.",
    "",
    "——— Submission ———",
    `Learner: ${data.learnerName}`,
    `Email: ${data.learnerEmail}`,
    `Course: ${data.courseTitle}`,
    `Assignment / title: ${data.assignmentTitle}`,
    `Submission ID: ${data.submissionId}`,
    "———",
    "",
    `Review and grade in the admin dashboard: ${FRONTEND_URL}/admin/assignment-submissions`,
  ];
  await sendAdminEmail(subject, lines.join("\n"));
}

/** Notify learner when marks are set or updated for their submission. */
export async function notifyLearnerAssignmentGraded(data: {
  name: string;
  email: string;
  courseTitle: string;
  assignmentTitle: string;
  marks: number;
  maxMarks: number;
  feedback?: string;
}): Promise<void> {
  const subject = `[KSOSHTC] Marks released: ${data.assignmentTitle}`;
  const fb =
    data.feedback && data.feedback.trim()
      ? ["", "Feedback from your instructor:", data.feedback.trim()].join("\n")
      : "";
  const lines = [
    `Hello ${data.name},`,
    "",
    `Your marks are now available for the following submission.`,
    "",
    `Course: ${data.courseTitle}`,
    `Assignment: ${data.assignmentTitle}`,
    `Score: ${data.marks} / ${data.maxMarks}`,
    fb,
    "",
    `View your dashboard: ${FRONTEND_URL}/dashboard/work-submissions`,
    "",
    "— Kigali Safety & OSH Training Centre",
  ];
  await sendEmail(data.email, subject, lines.join("\n"));
}

/**
 * Optional: POST form data to Netlify so it appears in Netlify Forms (form detection).
 * The deployed site must have hidden forms with data-netlify="true" and name="registration" / name="contact".
 */
async function submitToNetlifyForm(
  formName: string,
  data: Record<string, string>
): Promise<void> {
  const url = process.env.NETLIFY_FORM_SUBMIT_URL ?? FRONTEND_URL;
  if (!url || url === "http://localhost:8080") return;
  const body = new URLSearchParams({ "form-name": formName, ...data }).toString();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (res.ok) console.log("[NOTIFY] Netlify form submitted:", formName);
    else console.log("[NOTIFY] Netlify form POST status:", res.status, formName);
  } catch (e) {
    console.log("[NOTIFY] Netlify form POST failed:", e instanceof Error ? e.message : e);
  }
}
