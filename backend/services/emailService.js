/**
 * File Purpose:
 * Sends transactional email messages for account recovery workflows.
 */
import nodemailer from "nodemailer";

/**
 * Creates the SMTP transporter used for password reset emails.
 */
function createTransporter() {
  console.log("[EMAIL] Host:", process.env.SMTP_HOST);
  console.log("[EMAIL] Port:", process.env.SMTP_PORT);
  console.log("[EMAIL] Secure:", process.env.SMTP_SECURE);
  console.log("[EMAIL] User:", process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // Timeout settings for debugging SMTP connectivity
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  transporter.verify((error) => {
    if (error) {
      console.error("[EMAIL] SMTP verification failed:", error);
    } else {
      console.log("[EMAIL] SMTP ready");
    }
  });

  return transporter;
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(to, resetLink) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Chat Buddy Password Reset",
    text: `Hello,

You requested a password reset for your Chat Buddy account.

Click the link below:

${resetLink}

This link expires in 15 minutes.

If you did not request this reset, please ignore this email.`,
  });
}