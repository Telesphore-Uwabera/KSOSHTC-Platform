/**
 * Transactional email (Brevo or SMTP): HTML + plain text per template.
 * Sends after successful Firestore writes where applicable.
 */

import nodemailer from "nodemailer";
import type { CourseId, Instructor } from "@shared/api";
import { mongoCollection, MONGO_COLLECTIONS } from "./mongo";

/** Admin inbox for approvals and notifications (use ADMIN_EMAIL in .env; fallback for notifications). */
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim() || "ksoshtc@gmail.com";
/**
 * Links in emails (password reset, registration, etc.) use `webBase()`.
 * If the apex domain has no valid HTTPS but `www` does (common on Netlify), set on the API host:
 *   PUBLIC_SITE_URL=https://www.kigalisafetytraining.com
 * `FRONTEND_URL` is still used for CORS on the backend; it should match the origin browsers use.
 */
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://www.kigalisafetytraining.com";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getBrevoApiKey(): string | null {
  const k = process.env.BREVO_API_KEY?.trim();
  return k || null;
}

/**
 * Brevo requires a verified sender. Set BREVO_SENDER_EMAIL (+ optional BREVO_SENDER_NAME),
 * or use SMTP_FROM / SMTP_USER (must match an address verified in Brevo).
 */
function brevoSender(): { name: string; email: string } {
  const explicitEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const explicitName = process.env.BREVO_SENDER_NAME?.trim();
  if (explicitEmail) {
    return { name: explicitName || "KSOSHTC", email: explicitEmail };
  }
  const raw = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || ADMIN_EMAIL;
  const m = raw.match(/^(.+?)\s*<([^>\s]+@[^>\s]+)>\s*$/);
  if (m) {
    return { name: m[1].trim().replace(/^["']|["']$/g, ""), email: m[2].trim() };
  }
  return { name: "KSOSHTC", email: raw };
}

async function sendViaBrevo(
  to: string,
  subject: string,
  textContent: string,
  htmlContent: string
): Promise<void> {
  const apiKey = getBrevoApiKey();
  if (!apiKey) throw new Error("BREVO_API_KEY missing");

  const sender = brevoSender();
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: sender.name, email: sender.email },
      to: [{ email: to }],
      subject,
      textContent,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo API ${res.status}: ${errText || res.statusText}`);
  }
}

/** Support line appended to every transactional email (plain + HTML with clickable WhatsApp). */
export const SUPPORT_PHONE_DISPLAY = "+250 785 072 512";
/** Rwanda local format (no spaces) for MoMo / call / WhatsApp lines in learner emails. */
export const SUPPORT_PHONE_LOCAL_RW = "0785072512";
const SUPPORT_WHATSAPP_WA_ME = "https://wa.me/250785072512";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function webBase(): string {
  const raw =
    process.env.PUBLIC_SITE_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    FRONTEND_URL;
  return raw.replace(/\/$/, "");
}

/** Closing block for learner-facing transactional emails (registration email omits this by design). */
function emailLearnerFooterText(): string {
  const web = webBase();
  return [
    "",
    "────────────────────────────────────",
    "Kind regards,",
    "KSOSHTC Management",
    "",
    "—",
    `Website: ${web}`,
    `WhatsApp (tap to chat): ${SUPPORT_WHATSAPP_WA_ME}`,
    `Call / WhatsApp: ${SUPPORT_PHONE_LOCAL_RW} · ${SUPPORT_PHONE_DISPLAY}`,
    "",
    "Kigali Safety & OSH Training Centre (KSOS HTC)",
  ].join("\n");
}

function emailLearnerFooterHtml(): string {
  const web = webBase();
  return `<div style="margin-top:1.5em;padding-top:1.25em;border-top:1px solid #dee2e6;font-size:14px;color:#444;line-height:1.6;">
<p style="margin:0;">Kind regards,<br><strong style="color:#1a1a1a;">KSOSHTC Management</strong></p>
<p style="margin:1em 0 0;">
<a href="${web}" style="color:#0d6efd;">Visit our website</a>
&nbsp;·&nbsp;
<a href="${SUPPORT_WHATSAPP_WA_ME}" style="color:#0d6efd;">WhatsApp</a>
&nbsp;·&nbsp;
${escapeHtml(SUPPORT_PHONE_LOCAL_RW)}
</p>
<p style="margin:0.75em 0 0;font-size:13px;color:#666;">Kigali Safety &amp; OSH Training Centre (KSOS HTC)</p>
</div>`;
}

/** Footer for admin inbox notifications (internal tone). */
function emailAdminFooterText(): string {
  const web = webBase();
  return [
    "",
    "────────────────────────────────────",
    "This is an automated message from the KSOSHTC platform.",
    "",
    `Admin dashboard: ${web}/admin`,
    `Public website: ${web}`,
    `Support — WhatsApp: ${SUPPORT_WHATSAPP_WA_ME}`,
    `Call / WhatsApp: ${SUPPORT_PHONE_LOCAL_RW} (${SUPPORT_PHONE_DISPLAY})`,
  ].join("\n");
}

function emailAdminFooterHtml(): string {
  const web = webBase();
  return `<div style="margin-top:1.5em;padding-top:1.25em;border-top:1px solid #dee2e6;font-size:14px;color:#444;line-height:1.6;">
<p style="margin:0;font-size:13px;color:#666;">Automated notification · <strong style="color:#1a1a1a;">KSOSHTC</strong></p>
<p style="margin:0.75em 0 0;"><a href="${web}/admin" style="color:#0d6efd;">Admin dashboard</a> · <a href="${web}" style="color:#0d6efd;">Website</a></p>
<p style="margin:0.5em 0 0;">
<a href="${SUPPORT_WHATSAPP_WA_ME}" style="color:#0d6efd;">WhatsApp</a>
&nbsp;·&nbsp; ${escapeHtml(SUPPORT_PHONE_LOCAL_RW)} (${escapeHtml(SUPPORT_PHONE_DISPLAY)})
</p>
</div>`;
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

export type SendEmailOptions = {
  appendSupportFooter?: boolean;
  /** Admin notifications use a neutral footer; learners get sign-off + website / WhatsApp. */
  audience?: "learner" | "admin";
};

/** Send email to a single recipient. Uses Brevo when BREVO_API_KEY is set; otherwise SMTP. */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  options?: SendEmailOptions
): Promise<void> {
  const append = options?.appendSupportFooter !== false;
  const audience = options?.audience ?? "learner";
  const textBody = append
    ? text.trimEnd() +
    "\n" +
    (audience === "admin" ? emailAdminFooterText() : emailLearnerFooterText())
    : text.trimEnd();
  const baseHtml = html ?? text.replace(/\n/g, "<br>\n");
  const htmlBody = append
    ? baseHtml + (audience === "admin" ? emailAdminFooterHtml() : emailLearnerFooterHtml())
    : baseHtml;

  if (getBrevoApiKey()) {
    try {
      await sendViaBrevo(to, subject, textBody, htmlBody);
      console.log("[NOTIFY] Email sent via Brevo:", subject, "to", to);
    } catch (e) {
      console.error("[NOTIFY] Brevo failed:", e instanceof Error ? e.message : e);
      if (e instanceof Error && e.stack) console.error("[NOTIFY_STACK]", e.stack);
    }
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    console.log("[NOTIFY] Email not configured (set BREVO_API_KEY or SMTP); skipping:", subject);
    return;
  }
  try {
    const info = await transport.sendMail({
      from: fromAddress(),
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.log("[NOTIFY] Email sent via SMTP:", subject, "to", to, "Response:", info.response);
  } catch (e) {
    console.error("[NOTIFY] SMTP failed:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.stack) console.error("[NOTIFY_STACK]", e.stack);
  }
}

/** Admin-only test: uses Brevo if BREVO_API_KEY is set, otherwise SMTP verify + send. */
export async function testEmail(to: string): Promise<{ success: boolean; message: string }> {
  try {
    if (getBrevoApiKey()) {
      const subj = "[KSOSHTC] Email delivery test — Brevo";
      const baseText =
        "This is a test message from the KSOSHTC platform. If you received it, your Brevo API configuration is working correctly.";
      const baseHtml = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a1a1a;">
<p style="margin:0;">This is a <strong>test message</strong> from the KSOSHTC platform.</p>
<p style="margin:1em 0 0;">If you received this email, your <strong>Brevo</strong> integration is configured correctly.</p>
</div>`;
      await sendViaBrevo(
        to,
        subj,
        baseText + "\n" + emailLearnerFooterText(),
        baseHtml + emailLearnerFooterHtml()
      );
      return { success: true, message: `Test email sent to ${to} via Brevo. Check inbox and SPAM folder.` };
    }
    const transport = getTransporter();
    if (!transport) {
      return {
        success: false,
        message: "No email provider: set BREVO_API_KEY or SMTP (HOST, USER, PASS).",
      };
    }
    await transport.verify();
    await sendEmail(
      to,
      "[KSOSHTC] Email delivery test — SMTP",
      "This is a test message from the KSOSHTC platform. If you received it, your SMTP settings are working correctly.",
      `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a1a1a;">
<p style="margin:0;">This is a <strong>test message</strong> from the KSOSHTC platform.</p>
<p style="margin:1em 0 0;">If you received this email, your <strong>SMTP</strong> configuration is working correctly.</p>
</div>`
    );
    return { success: true, message: `Test email sent to ${to} via SMTP. Check inbox and SPAM folder.` };
  } catch (e) {
    console.error("[NOTIFY_TEST] Email verify/send failed:", e);
    return { success: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Send email to admin. No-op if SMTP not configured. */
export async function sendAdminEmail(subject: string, text: string, html?: string): Promise<void> {
  if (!ADMIN_EMAIL) return;
  await sendEmail(ADMIN_EMAIL, subject, text, html, { audience: "admin" });
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
  const subject = `[KSOSHTC] New learner registration — ${data.name}`;
  const phone = data.phone ?? "—";
  const org = data.organization ?? "—";
  const sector = data.sector ?? "—";
  const registered = data.createdAt ?? new Date().toISOString();
  const adminLearners = `${webBase()}/admin/learners`;

  const text = [
    "A new learner has completed the registration form. Their details are stored in your database.",
    "Please review the record below and approve the account once any required registration fee payment has been confirmed.",
    "",
    "REGISTRANT DETAILS",
    `Full name:        ${data.name}`,
    `Email:           ${data.email}`,
    `Phone:           ${phone}`,
    `Organisation:    ${org}`,
    `Sector:          ${sector}`,
    `Registered at:   ${registered}`,
    "",
    "NEXT STEP",
    `Open the Learners section in your admin dashboard to approve or manage this user:`,
    adminLearners,
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">A new learner has completed the registration form. Their details are stored in your database.</p>
<p style="margin:0 0 1.25em;">Please review the record below and <strong>approve the account</strong> once any required <strong>registration fee</strong> payment has been confirmed.</p>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">REGISTRANT DETAILS</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1.25em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Full name</td><td style="padding:6px 0;"><strong>${escapeHtml(data.name)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#0d6efd;">${escapeHtml(data.email)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Phone</td><td style="padding:6px 0;">${escapeHtml(phone)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Organisation</td><td style="padding:6px 0;">${escapeHtml(org)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Sector</td><td style="padding:6px 0;">${escapeHtml(sector)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Registered at</td><td style="padding:6px 0;">${escapeHtml(registered)}</td></tr>
</table>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">NEXT STEP</p>
<p style="margin:0 0 0.75em;">Open the <strong>Learners</strong> section to approve or manage this user:</p>
<p style="margin:0;"><a href="${adminLearners}" style="display:inline-block;background:#0d6efd;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Go to Learners</a></p>
</div>`;

  await sendAdminEmail(subject, text, html);

  await submitToNetlifyForm("registration", {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    organization: data.organization ?? "",
    sector: data.sector ?? "",
  });
}

/** Notify learner after registration with programme details, fees, MoMo payment, and links (approval after payment). */
export async function notifyLearnerRegistrationReceived(data: { name: string; email: string }): Promise<void> {
  const subject = "[KSOSHTC] Welcome — your registration and next steps";
  const name = data.name.trim();
  const web = webBase();

  const text = [
    `Dear ${name},`,
    "",
    "Thank you for choosing Kigali Safety & OSH Training Centre (KSOS HTC). We are pleased to confirm that we have received your registration.",
    "",
    "PROGRAMME OVERVIEW",
    "• Training sectors: OSH in Industrial Safety, OSH in Construction, and OSH in Mining.",
    "• In-person classes: Sundays, 09:00–14:00 (EAT), for three months.",
    "• Online sessions: Fridays, 14:00–17:00, live via Google Meet.",
    "• Course materials are available on our website once your learning account is activated.",
    "• After you complete the training, you will receive a certificate.",
    "",
    "FEES",
    "• Registration fee: 10,000 FRW (required to access course materials).",
    "• Tuition fee: 300,000 FRW (payable in instalments; contact us to arrange a payment plan).",
    "",
    "REGISTRATION FEE — PAYMENT (MOBILE MONEY)",
    "To unlock access to course materials, please pay the registration fee of 10,000 FRW via MoMo to:",
    `  ${SUPPORT_PHONE_LOCAL_RW} — EMMANUEL NIYOBUHUNGIRO`,
    "",
    "Alternative (bank transfer), if you prefer:",
    "  Bank: EQUITY (Equity Bank)",
    "  Account name: Kigali Safety OSH",
    "  Account number: 4025201372795",
    "",
    "Once your payment is confirmed, your account will be approved and you will receive instructions to log in.",
    "",
    "USEFUL LINKS",
    `• Visit our website: ${web}`,
    `• WhatsApp (tap to chat): ${SUPPORT_WHATSAPP_WA_ME}`,
    `• Call / WhatsApp: ${SUPPORT_PHONE_LOCAL_RW}`,
    "",
    "We look forward to supporting your professional development in occupational safety and health.",
    "",
    "KSOSHTC Management",
  ].join("\n");

  const htmlBody = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Thank you for choosing <strong>Kigali Safety &amp; OSH Training Centre (KSOS HTC)</strong>. We are pleased to confirm that we have received your registration.</p>
<p style="margin:1.25em 0 0.35em;font-weight:bold;letter-spacing:0.03em;">PROGRAMME OVERVIEW</p>
<ul style="margin:0 0 1em;padding-left:1.25em;">
<li>Training sectors: OSH in Industrial Safety, OSH in Construction, and OSH in Mining.</li>
<li>In-person classes: Sundays, 09:00–14:00 (EAT), for three months.</li>
<li>Online sessions: Fridays, 14:00–17:00, live via Google Meet.</li>
<li>Course materials are available on our website once your learning account is activated.</li>
<li>After you complete the training, you will receive a certificate.</li>
</ul>
<p style="margin:1.25em 0 0.35em;font-weight:bold;letter-spacing:0.03em;">FEES</p>
<ul style="margin:0 0 1em;padding-left:1.25em;">
<li><strong>Registration fee:</strong> 10,000 FRW (required to access course materials).</li>
<li><strong>Tuition fee:</strong> 300,000 FRW (payable in instalments; contact us to arrange a payment plan).</li>
</ul>
<p style="margin:1.25em 0 0.35em;font-weight:bold;letter-spacing:0.03em;">REGISTRATION FEE — PAYMENT (MOBILE MONEY)</p>
<p style="margin:0 0 1em;">To unlock access to course materials, please pay the <strong>registration fee of 10,000 FRW</strong> via MoMo to:</p>
<p style="margin:0 0 1em;padding:0.75em 1em;background:#f5f5f5;border-radius:6px;"><strong>${escapeHtml(SUPPORT_PHONE_LOCAL_RW)}</strong> — EMMANUEL NIYOBUHUNGIRO</p>
<p style="margin:1em 0 0.35em;font-size:14px;color:#444;"><strong>Alternative (bank transfer)</strong></p>
<p style="margin:0 0 1em;padding:0.75em 1em;background:#f8f9fa;border-radius:6px;border-left:4px solid #0d6efd;line-height:1.6;">
<strong>Bank:</strong> EQUITY (Equity Bank)<br/>
<strong>Account name:</strong> Kigali Safety OSH<br/>
<strong>Account number:</strong> 4025201372795
</p>
<p style="margin:1em 0;">Once your payment is confirmed, your account will be approved and you will receive instructions to log in.</p>
<p style="margin:1.25em 0 0.35em;font-weight:bold;letter-spacing:0.03em;">USEFUL LINKS</p>
<ul style="margin:0 0 1em;padding-left:1.25em;">
<li><a href="${web}" style="color:#0d6efd;">Visit our website</a></li>
<li><a href="${SUPPORT_WHATSAPP_WA_ME}" style="color:#0d6efd;">Message us on WhatsApp</a> (same number for calls)</li>
<li>Call / WhatsApp: <strong>${escapeHtml(SUPPORT_PHONE_LOCAL_RW)}</strong></li>
</ul>
<p style="margin:1.25em 0 0.75em;">Thank you for joining us — where we think, we talk, and we do safety.</p>
<p style="margin:0;font-weight:bold;">KSOSHTC Management</p>
</div>`;

  await sendEmail(data.email, subject, text, htmlBody, { appendSupportFooter: false });
}

/** Notify admin of new contact form submission (call after Firestore write). */
export async function notifyNewContact(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<void> {
  const subject = `[KSOSHTC] Website contact — ${data.name}`;
  const phone = data.phone ?? "—";

  const text = [
    "Someone has submitted a message through the KSOSHTC website contact form.",
    "The message has been saved. You can reply directly to the sender using the email address below.",
    "",
    "SENDER",
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Phone:   ${phone}`,
    "",
    "MESSAGE",
    data.message,
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Someone has submitted a message through the <strong>KSOSHTC website contact form</strong>. The message has been saved.</p>
<p style="margin:0 0 1.25em;">You may <strong>reply directly</strong> to the sender at the email address below.</p>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">SENDER</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1.25em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Name</td><td style="padding:6px 0;"><strong>${escapeHtml(data.name)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#0d6efd;">${escapeHtml(data.email)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Phone</td><td style="padding:6px 0;">${escapeHtml(phone)}</td></tr>
</table>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">MESSAGE</p>
<div style="padding:14px 16px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;white-space:pre-wrap;font-size:14px;">${escapeHtml(data.message)}</div>
</div>`;

  await sendAdminEmail(subject, text, html);

  await submitToNetlifyForm("contact", {
    name: data.name,
    email: data.email,
    phone: data.phone ?? "",
    message: data.message,
  });
}

/** Notify the learner that their account has been approved (call after setting approved: true). */
export async function notifyLearnerApproved(data: { name: string; email: string }): Promise<void> {
  const subject = "[KSOSHTC] Your account is active — welcome aboard";
  const name = data.name.trim();
  const web = webBase();
  const loginUrl = `${web}/login`;
  const dashboardUrl = `${web}/dashboard`;

  const text = [
    `Dear ${name},`,
    "",
    "Good news — an administrator has approved your KSOS HTC learner account.",
    "",
    "You can sign in anytime to access your dashboard, courses, materials, and assignments (according to your enrollments).",
    "",
    "Sign in:",
    loginUrl,
    "",
    "Learner dashboard:",
    dashboardUrl,
    "",
    "If you have any questions, please use the website or WhatsApp details at the end of this email.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Good news — an administrator has <strong>approved</strong> your <strong>KSOS HTC</strong> learner account.</p>
<p style="margin:0 0 1em;">You may <strong>sign in</strong> to access your dashboard, courses, materials, and assignments (based on your enrollments).</p>
<p style="margin:0 0 0.75em;"><a href="${loginUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Sign in to your account</a></p>
<p style="margin:0;font-size:14px;color:#555;">Or open this link in your browser:<br><a href="${loginUrl}" style="color:#0d6efd;word-break:break-all;">${loginUrl}</a></p>
<p style="margin:1em 0 0.75em;font-size:14px;color:#555;">Your learner dashboard:<br><a href="${dashboardUrl}" style="color:#0d6efd;word-break:break-all;">${dashboardUrl}</a></p>
<p style="margin:1.25em 0 0;font-size:14px;color:#444;">If you need assistance, use the <strong>website</strong> and <strong>WhatsApp</strong> information below.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/**
 * Notify learner when they gain access to a course (new enrollment, or enrollment status activated).
 * @param kind — "enrolled": newly added to the course; "activated": was pending and is now active.
 */
export async function notifyLearnerCourseAccess(data: {
  name: string;
  email: string;
  courseTitle: string;
  kind: "enrolled" | "activated";
}): Promise<void> {
  const name = data.name.trim();
  const courseTitle = data.courseTitle.trim();
  const web = webBase();
  const dashboardUrl = `${web}/dashboard/courses`;

  const headline =
    data.kind === "activated"
      ? `Your access to "${courseTitle}" is now active on KSOS HTC.`
      : `You have been enrolled in "${courseTitle}" on KSOS HTC.`;

  const subject =
    data.kind === "activated"
      ? `[KSOSHTC] Course access active — ${courseTitle}`
      : `[KSOSHTC] New course — ${courseTitle}`;

  const text = [
    `Dear ${name},`,
    "",
    headline,
    "",
    "Sign in to open My courses and start or continue your learning:",
    web + "/login",
    "",
    "Direct link to your courses list:",
    dashboardUrl,
    "",
    "If you have questions, use the website or WhatsApp details at the end of this email.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">${escapeHtml(headline)}</p>
<p style="margin:0 0 0.75em;"><a href="${web}/login" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Sign in</a></p>
<p style="margin:0 0 1em;font-size:14px;color:#555;">Open <strong>My courses</strong> on your dashboard:<br><a href="${dashboardUrl}" style="color:#0d6efd;word-break:break-all;">${dashboardUrl}</a></p>
<p style="margin:1.25em 0 0;font-size:14px;color:#444;">If you need assistance, use the <strong>website</strong> and <strong>WhatsApp</strong> information below.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Learner email when admin publishes a distributed handout (any allowed file type) for course(s) they follow. */
export async function notifyLearnerAdminDistributedPdf(data: {
  name: string;
  email: string;
  title: string;
  description?: string;
  courseLabels: string;
}): Promise<void> {
  const name = data.name.trim();
  const title = data.title.trim();
  const web = webBase();
  const handoutsUrl = `${web}/dashboard/handouts`;
  const submitUrl = `${web}/dashboard/work-submissions`;

  const desc =
    data.description && data.description.trim()
      ? ["", "Details:", data.description.trim()].join("\n")
      : "";
  const descHtml =
    data.description && data.description.trim()
      ? `<p style="margin:1em 0 0;font-weight:bold;">Details</p>
<p style="margin:0.35em 0 0;white-space:pre-wrap;font-size:14px;color:#444;">${escapeHtml(data.description.trim())}</p>`
      : "";

  const subject = `[KSOSHTC] New assignment / material — ${title}`;

  const text = [
    `Dear ${name},`,
    "",
    "Your instructors have shared new assignment or quiz material for your programme.",
    "",
    `Title: ${title}`,
    `Relevant course(s): ${data.courseLabels}`,
    desc,
    "",
    "Open the assignment file from the Assignments page on your learner dashboard:",
    handoutsUrl,
    "",
    "You can also find the same list under Submit work:",
    submitUrl,
    "",
    "Thank you for learning with KSOS HTC.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Your instructors have shared <strong>new assignment or quiz material</strong> for your programme.</p>
<p style="margin:0 0 0.35em;"><strong>Title</strong></p>
<p style="margin:0 0 0.75em;font-size:16px;color:#0d6efd;">${escapeHtml(title)}</p>
<p style="margin:0 0 0.35em;"><strong>Relevant course(s)</strong></p>
<p style="margin:0 0 0.75em;">${escapeHtml(data.courseLabels)}</p>
${descHtml}
<p style="margin:1.25em 0 0.75em;">View and open the assignment file on the <strong>Assignments</strong> page:</p>
<p style="margin:0;"><a href="${handoutsUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Open assignment file</a></p>
<p style="margin:1em 0 0;font-size:14px;color:#555;word-break:break-all;"><a href="${handoutsUrl}" style="color:#0d6efd;">${escapeHtml(handoutsUrl)}</a></p>
<p style="margin:1em 0 0;font-size:14px;color:#555;">The same files appear under <a href="${submitUrl}" style="color:#0d6efd;">Submit work</a> in your dashboard.</p>
<p style="margin:1.25em 0 0;font-size:14px;color:#444;">Thank you for learning with <strong>KSOS HTC</strong>.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Notify learner after a module / break quiz is submitted and auto-marked on the server. */
export async function notifyLearnerModuleQuizResult(data: {
  name: string;
  email: string;
  courseTitle: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  courseId: string;
}): Promise<void> {
  const name = data.name.trim();
  const quizTitle = data.quizTitle.trim();
  const courseTitle = data.courseTitle.trim();
  const web = webBase();
  const courseUrl = `${web}/courses/${encodeURIComponent(data.courseId)}`;
  const progressUrl = `${web}/dashboard/progress`;
  const passLabel = data.passed ? "Passed" : "Not passed — you can review the course and try again";

  const subject = `[KSOSHTC] Quiz result — ${quizTitle}`;

  const text = [
    `Dear ${name},`,
    "",
    "Your answers for a module quiz have been marked automatically.",
    "",
    `Course:     ${courseTitle}`,
    `Quiz:       ${quizTitle}`,
    `Score:      ${data.score} / ${data.maxScore} (${data.percentage}%)`,
    `Result:     ${passLabel}`,
    "",
    "Continue learning:",
    courseUrl,
    "",
    "Track progress on your dashboard:",
    progressUrl,
    "",
    "Thank you for learning with KSOS HTC.",
  ].join("\n");

  const resultColor = data.passed ? "#198754" : "#b45309";
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Your answers for a <strong>module quiz</strong> have been marked automatically.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;">Course</td><td style="padding:6px 0;">${escapeHtml(courseTitle)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;">Quiz</td><td style="padding:6px 0;"><strong>${escapeHtml(quizTitle)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;">Score</td><td style="padding:6px 0;"><strong style="font-size:1.1em;color:#0d6efd;">${data.score}</strong> / ${data.maxScore} <span style="color:#555;">(${data.percentage}%)</span></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Result</td><td style="padding:6px 0;"><strong style="color:${resultColor};">${data.passed ? "Passed" : "Not passed"}</strong>${data.passed ? "" : " — review the course material and try again when ready."}</td></tr>
</table>
<p style="margin:0 0 0.75em;"><a href="${courseUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Open course</a></p>
<p style="margin:0;font-size:14px;color:#555;">View overall progress: <a href="${progressUrl}" style="color:#0d6efd;">${progressUrl}</a></p>
<p style="margin:1.25em 0 0;font-size:14px;color:#444;">Thank you for learning with <strong>KSOS HTC</strong>.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Notify learner with a password reset link. */
export async function notifyPasswordReset(data: { name: string; email: string; token: string }): Promise<void> {
  const subject = "[KSOSHTC] Password reset request — secure action required";
  const name = data.name.trim();
  const resetUrl = `${webBase()}/reset-password/${data.token}`;

  const text = [
    `Dear ${name},`,
    "",
    "We received a request to reset the password for your KSOSHTC learner account.",
    "",
    "For your security, this reset link can be used only once and will expire in one hour.",
    "",
    "Please use the secure link below to set a new password:",
    resetUrl,
    "",
    "If you did not make this request, please ignore this message. Your current password will remain unchanged.",
    "",
    "For your protection, never share this link. KSOSHTC staff will never ask for your password or reset link by phone, email, or WhatsApp.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">We received a request to reset the password for your <strong>KSOSHTC</strong> learner account.</p>
<p style="margin:0 0 1em;">For your security, the button below can be used <strong>only once</strong> and will <strong>expire in one hour</strong>.</p>
<p style="margin:0 0 0.75em;"><a href="${resetUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Set a new password</a></p>
<p style="margin:0;font-size:13px;color:#555;word-break:break-all;"><a href="${resetUrl}" style="color:#0d6efd;">${escapeHtml(resetUrl)}</a></p>
<p style="margin:1.25em 0 0;">If you did <strong>not</strong> make this request, please ignore this email. Your current password will remain unchanged.</p>
<p style="margin:1em 0 0;font-size:14px;color:#555;">For your protection, never share this link. KSOSHTC will never ask for your password or reset link by phone, email, or WhatsApp.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Notify instructor when an admin creates an instructor account with credentials. */
export async function notifyInstructorCreated(data: { name: string; email: string; tempPassword: string }): Promise<void> {
  const subject = "[KSOSHTC] Instructor account ready — sign in";
  const name = data.name.trim();
  const loginUrl = `${webBase()}/login`;

  const text = [
    `Dear ${name},`,
    "",
    "An instructor account has been created for you on KSOSHTC.",
    "",
    "Sign in here:",
    loginUrl,
    "",
    "Your email:",
    data.email,
    "",
    "Temporary password:",
    data.tempPassword,
    "",
    "For security, please change your password after your first login and do not share it with anyone.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Your <strong>instructor account</strong> is ready on <strong>KSOSHTC</strong>.</p>
<p style="margin:0 0 0.75em;font-size:14px;color:#444;">Sign in:</p>
<p style="margin:0 0 1em;"><a href="${loginUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Go to login</a></p>
<p style="margin:0 0 0.5em;font-size:14px;color:#555;"><strong>Email</strong><br>${escapeHtml(data.email)}</p>
<p style="margin:0 0 0.5em;font-size:14px;color:#555;"><strong>Temporary password</strong><br><span style="font-family:monospace;">${escapeHtml(
    data.tempPassword
  )}</span></p>
<p style="margin:1em 0 0;font-size:14px;color:#444;">For security, please change your password after your first login and do not share it with anyone.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Sent after the learner successfully sets a new password via the reset link. */
export async function notifyPasswordResetSuccessful(data: { name: string; email: string }): Promise<void> {
  const subject = "[KSOSHTC] Your password was changed";
  const name = data.name.trim();
  const loginUrl = `${webBase()}/login`;

  const text = [
    `Dear ${name},`,
    "",
    "This confirms that the password for your KSOSHTC learner account was just changed.",
    "",
    "If you made this change, no further action is needed. You can sign in with your new password:",
    loginUrl,
    "",
    "If you did not change your password, someone else may have access to your account. Reset your password again from the login page and contact us via the website or WhatsApp if you need help.",
    "",
    "KSOSHTC will never ask you for your password by email, phone, or WhatsApp.",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">This confirms that the password for your <strong>KSOSHTC</strong> learner account was <strong>just changed</strong>.</p>
<p style="margin:0 0 1em;">If you made this change, no further action is needed. You can sign in with your new password:</p>
<p style="margin:0 0 1em;"><a href="${loginUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Sign in</a></p>
<p style="margin:0;font-size:14px;color:#555;word-break:break-all;"><a href="${loginUrl}" style="color:#0d6efd;">${escapeHtml(loginUrl)}</a></p>
<p style="margin:1.25em 0 0;">If you <strong>did not</strong> change your password, someone else may have access to your account. Use <strong>Forgot password</strong> on the login page to secure it again, and contact us via the website or WhatsApp if you need help.</p>
<p style="margin:1em 0 0;font-size:14px;color:#555;">KSOSHTC will never ask you for your password by email, phone, or WhatsApp.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Notify admin when a learner submits assignment PDF (after Firestore + upload). */
export async function notifyAdminAssignmentSubmitted(data: {
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  assignmentTitle: string;
  submissionId: string;
}): Promise<void> {
  const subject = `[KSOSHTC] New assignment submission — ${data.assignmentTitle}`;
  const gradeUrl = `${webBase()}/admin/assignment-submissions`;

  const text = [
    "A learner has uploaded a PDF assignment for your review.",
    "Please open the admin assignments page to view the file and record marks when ready.",
    "",
    "SUBMISSION SUMMARY",
    `Learner:     ${data.learnerName}`,
    `Email:       ${data.learnerEmail}`,
    `Course:      ${data.courseTitle}`,
    `Title:       ${data.assignmentTitle}`,
    `Reference:   ${data.submissionId}`,
    "",
    "Review submissions:",
    gradeUrl,
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">A learner has uploaded a <strong>PDF assignment</strong> for your review.</p>
<p style="margin:0 0 1.25em;">Open the <strong>Assignments</strong> page in your admin dashboard to view the document and enter marks when you are ready.</p>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">SUBMISSION SUMMARY</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1.25em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Learner</td><td style="padding:6px 0;"><strong>${escapeHtml(data.learnerName)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.learnerEmail)}" style="color:#0d6efd;">${escapeHtml(data.learnerEmail)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Course</td><td style="padding:6px 0;">${escapeHtml(data.courseTitle)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Title</td><td style="padding:6px 0;">${escapeHtml(data.assignmentTitle)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Reference ID</td><td style="padding:6px 0;font-family:monospace;font-size:13px;">${escapeHtml(data.submissionId)}</td></tr>
</table>
<p style="margin:0;"><a href="${gradeUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open Assignments</a></p>
</div>`;

  await sendAdminEmail(subject, text, html);
}

/** Notify learner after they successfully submit an assignment. */
export async function notifyLearnerAssignmentSubmitted(data: {
  name: string;
  email: string;
  courseTitle: string;
  assignmentTitle: string;
  submissionId: string;
}): Promise<void> {
  const subject = `[KSOSHTC] Assignment submitted successfully — ${data.assignmentTitle}`;
  const web = webBase();
  const submissionsUrl = `${web}/dashboard/work-submissions`;

  const text = [
    `Dear ${data.name},`,
    "",
    "This email confirms that your assignment has been successfully submitted.",
    "",
    "SUBMISSION DETAILS",
    `Course:         ${data.courseTitle}`,
    `Assignment:     ${data.assignmentTitle}`,
    `Reference ID:   ${data.submissionId}`,
    "",
    "Your instructor will review your work and provide feedback or marks when ready. You can track your submission status and see your results on your dashboard:",
    submissionsUrl,
    "",
    "To prevent multiple submissions, please note that you have already successfully uploaded this file.",
    "",
    "Thank you for your commitment to your studies.",
    "",
    "Kigali Safety & OSH Training Centre (KSOS HTC)",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(data.name)},</p>
<p style="margin:0 0 1em;">This email confirms that your <strong>assignment has been successfully submitted</strong>.</p>
<div style="background-color:#f8f9fa;border-radius:10px;padding:20px;margin:1.5em 0;border-left:4px solid #198754;">
  <p style="margin:0 0 0.5em;font-weight:bold;letter-spacing:0.03em;color:#198754;">SUBMISSION DETAILS</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;width:120px;">Course</td><td style="padding:4px 0;">${escapeHtml(
    data.courseTitle
  )}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">Assignment</td><td style="padding:4px 0;"><strong>${escapeHtml(
    data.assignmentTitle
  )}</strong></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">Reference ID</td><td style="padding:4px 0;font-family:monospace;font-size:13px;">${escapeHtml(
    data.submissionId
  )}</td></tr>
  </table>
</div>
<p style="margin:0 0 1em;">Your instructor will review your work and provide feedback or marks when ready. You can track your submission status and see your results on your dashboard:</p>
<p style="margin:0 0 1.5em;"><a href="${submissionsUrl}" style="display:inline-block;background:#198754;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Open my submissions</a></p>
<p style="margin:1em 0 0;font-size:14px;color:#157347;background:#d1e7dd;padding:10px 14px;border-radius:6px;font-style:italic;">
  <strong>Note:</strong> Your submission was successful. To prevent multiple submissions, please do not upload the same file again.
</p>
<p style="margin:1.5em 0 0;font-size:14px;color:#444;">Thank you for your commitment to your studies.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/** Notify the active instructor who created the assignment, if they still have access to the submission's course. */
export async function notifyInstructorsAssignmentSubmitted(data: {
  courseId: CourseId;
  courseTitle: string;
  learnerName: string;
  learnerEmail: string;
  assignmentTitle: string;
  submissionId: string;
  creatorUserId?: string;
}): Promise<void> {
  try {
    if (!data.creatorUserId) return; // Only notify if an explicit creator user ID is provided

    const instCol = mongoCollection<Instructor>(MONGO_COLLECTIONS.instructors);
    const instructors = await instCol
      .find({ active: true, userId: data.creatorUserId, allowedCourseIds: { $in: [data.courseId] } })
      .toArray();
    if (instructors.length === 0) return;

    const gradeUrl = `${webBase()}/admin/assignment-submissions`;
    const subject = `[KSOSHTC] New assignment submission — ${data.assignmentTitle}`;

    const textBase = [
      "A learner has uploaded an assignment for your review.",
      "Please open the Assignments page in your admin dashboard to view the file and record marks when ready.",
      "",
      "SUBMISSION SUMMARY",
      `Learner:     ${data.learnerName}`,
      `Email:       ${data.learnerEmail}`,
      `Course:      ${data.courseTitle}`,
      `Title:       ${data.assignmentTitle}`,
      `Reference:   ${data.submissionId}`,
      "",
      "Review submissions:",
      gradeUrl,
    ].join("\n");

    const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">A learner has uploaded an assignment <strong>for your review</strong>.</p>
<p style="margin:0 0 1.25em;">Open the <strong>Assignments</strong> page in your instructor dashboard to view the document and enter marks when you are ready.</p>
<p style="margin:0 0 0.35em;font-weight:bold;letter-spacing:0.03em;">SUBMISSION SUMMARY</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1.25em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Learner</td><td style="padding:6px 0;"><strong>${escapeHtml(
      data.learnerName
    )}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(
      data.learnerEmail
    )}" style="color:#0d6efd;">${escapeHtml(data.learnerEmail)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Course</td><td style="padding:6px 0;">${escapeHtml(
      data.courseTitle
    )}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Title</td><td style="padding:6px 0;">${escapeHtml(
      data.assignmentTitle
    )}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">Reference ID</td><td style="padding:6px 0;font-family:monospace;font-size:13px;">${escapeHtml(
      data.submissionId
    )}</td></tr>
</table>
<p style="margin:0;"><a href="${gradeUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open Assignments</a></p>
</div>`;

    await Promise.all(instructors.map((i) => sendEmail(i.email, subject, textBase, html, { appendSupportFooter: true })));
  } catch (e) {
    console.error("[NOTIFY_INSTRUCTOR_SUBMISSION] failed:", e);
  }
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
  const subject = `[KSOSHTC] Your assignment marks — ${data.assignmentTitle}`;
  const name = data.name.trim();
  const web = webBase();
  const submissionsUrl = `${web}/dashboard/work-submissions`;
  const fbText =
    data.feedback && data.feedback.trim()
      ? ["", "Instructor feedback:", data.feedback.trim()].join("\n")
      : "";
  const pct =
    data.maxMarks > 0 ? Math.round((data.marks / data.maxMarks) * 100) : null;

  const text = [
    `Dear ${name},`,
    "",
    "Your instructor has released marks for one of your submitted assignments.",
    "",
    `Course:     ${data.courseTitle}`,
    `Assignment: ${data.assignmentTitle}`,
    `Score:      ${data.marks} out of ${data.maxMarks}${pct != null ? ` (${pct}%)` : ""}`,
    fbText,
    "",
    "You can review this result and your other submissions here:",
    submissionsUrl,
    "",
    "Thank you for your continued engagement with KSOS HTC.",
  ].join("\n");

  const fbHtml =
    data.feedback && data.feedback.trim()
      ? `<p style="margin:1em 0 0;font-weight:bold;">Instructor feedback</p>
<div style="margin:0.5em 0 0;padding:12px 14px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;white-space:pre-wrap;font-size:14px;">${escapeHtml(data.feedback.trim())}</div>`
      : "";

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">
<p style="margin:0 0 1em;">Dear ${escapeHtml(name)},</p>
<p style="margin:0 0 1em;">Your instructor has released <strong>marks</strong> for one of your submitted assignments.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 1em;">
<tr><td style="padding:6px 12px 6px 0;color:#555;">Course</td><td style="padding:6px 0;">${escapeHtml(data.courseTitle)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;">Assignment</td><td style="padding:6px 0;"><strong>${escapeHtml(data.assignmentTitle)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#555;">Score</td><td style="padding:6px 0;"><strong style="font-size:1.1em;color:#0d6efd;">${data.marks}</strong> / ${data.maxMarks}${pct != null ? ` <span style="color:#555;">(${pct}%)</span>` : ""}</td></tr>
</table>
${fbHtml}
<p style="margin:1.25em 0 0.75em;">View this and your other submissions on your learner dashboard:</p>
<p style="margin:0;"><a href="${submissionsUrl}" style="display:inline-block;background:#0d6efd;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">Open my submissions</a></p>
<p style="margin:1.25em 0 0;font-size:14px;color:#444;">Thank you for your continued engagement with <strong>KSOS HTC</strong>.</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}

/**
 * Optional: POST form data to Netlify so it appears in Netlify Forms (form detection).
 * The deployed site must have hidden forms with data-netlify="true" and name="registration" / name="contact".
 */
async function submitToNetlifyForm(
  formName: string,
  data: Record<string, string>
): Promise<void> {
  const url = process.env.NETLIFY_FORM_SUBMIT_URL ?? webBase();
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

export async function notifyLearnerCertificateIssued(data: {
  name: string;
  email: string;
  courseTitle: string;
  certificateId: string;
}): Promise<void> {
  const subject = `[KSOSHTC] Congratulations — Your Certificate is Ready! — ${data.courseTitle}`;
  const web = webBase();
  const verifyUrl = `${web}/verify-certificate/${data.certificateId}`;

  const text = [
    `Dear ${data.name},`,
    "",
    "Congratulations! We are pleased to inform you that you have successfully completed your training and your Certificate of Competence is now ready.",
    "",
    "CERTIFICATE DETAILS",
    `Course:          ${data.courseTitle}`,
    `Certificate ID:  ${data.certificateId}`,
    "",
    "You can view, verify, and download your digital certificate as a PDF using the official link below:",
    verifyUrl,
    "",
    "This certificate recognizes your hard work and commitment to occupational safety and health standards. We hope this achievement supports your professional growth and contributes to a safer workplace for all.",
    "",
    "Once again, congratulations on this significant achievement!",
    "",
    "Best regards,",
    "Kigali Safety & OSH Training Centre (KSOS HTC)",
  ].join("\n");

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:#1e272e;max-width:640px;border:1px solid #e9ecef;border-radius:12px;padding:30px;background-color:#ffffff;">
<div style="text-align:center;margin-bottom:25px;">
  <img src="${web}/logo_transparent.webp" alt="KSOSHTC" style="height:70px;width:auto;" />
</div>
<h2 style="color:#004d40;text-align:center;margin-bottom:20px;font-size:24px;">Congratulations, ${escapeHtml(data.name)}!</h2>
<p style="margin:0 0 1.25em;">We are pleased to inform you that you have <strong>successfully completed</strong> your training at Kigali Safety &amp; OSH Training Centre.</p>
<p style="margin:0 0 1.5em;">Your official <strong>Certificate of Competence</strong> is now ready and has been recorded in our official registry.</p>
<div style="background-color:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:25px;border-left:4px solid #004d40;">
  <p style="margin:0 0 0.5em;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#666;">Programme</p>
  <p style="margin:0 0 1em;font-weight:bold;font-size:18px;color:#004d40;">${escapeHtml(data.courseTitle)}</p>
  <p style="margin:0 0 0.5em;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#666;">Certificate ID</p>
  <p style="margin:0;font-family:monospace;font-weight:bold;font-size:16px;">${escapeHtml(data.certificateId)}</p>
</div>
<p style="margin:0 0 1.5em;text-align:center;">Click the button below to view, verify, and <strong>download</strong> your digital certificate as a PDF:</p>
<p style="text-align:center;margin:0 0 1.5em;">
  <a href="${verifyUrl}" style="display:inline-block;background-color:#004d40;color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">Download My Certificate</a>
</p>
<p style="margin:0 0 1em;font-size:14px;color:#555;text-align:center;">Or copy this link to your browser:<br/><a href="${verifyUrl}" style="color:#004d40;word-break:break-all;">${verifyUrl}</a></p>
<hr style="border:0;border-top:1px solid #eee;margin:25px 0;" />
<p style="margin:0 0 1em;">This certificate recognizes your hard work and commitment to occupational safety and health standards. We hope this achievement supports your professional growth and contributes to a safer workplace for all.</p>
<p style="margin:0;font-weight:bold;color:#004d40;">Team KSOSHTC</p>
</div>`;

  await sendEmail(data.email, subject, text, html);
}