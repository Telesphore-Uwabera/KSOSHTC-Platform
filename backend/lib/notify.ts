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
 *      Your KSOSHTC learning account has been approved. You can now log in and access your courses.
 *
 *      Log in: {FRONTEND_URL}/login
 *
 *      — Kigali Safety & OSH Training Centre
 */

import nodemailer from "nodemailer";

/** Admin inbox for approvals and notifications (use ADMIN_EMAIL in .env; fallback for notifications). */
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim() || "kigalisafetyoshtrainingcenter@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://www.kigalisafetytraining.com";

/** Build transporter from env (SMTP). If not configured, returns null and we skip email. */
function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
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
  try {
    await transport.sendMail({
      from: fromAddress(),
      to,
      subject,
      text,
      html: html ?? text.replace(/\n/g, "<br>\n"),
    });
    console.log("[NOTIFY] Email sent:", subject, "to", to);
  } catch (e) {
    console.error("[NOTIFY] Email failed:", e instanceof Error ? e.message : e);
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
    "Your KSOSHTC learning account has been approved. You can now log in and access your courses.",
    "",
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
