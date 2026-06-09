/**
 * File Purpose:
 * Sends transactional email messages for account recovery workflows.
 */
import nodemailer from "nodemailer";

/**
 * Creates the SMTP transporter used for password reset emails.
 * Environment variables keep credentials out of source code.
 * @returns {object} Nodemailer transporter configured from environment variables
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends a password reset email to the account recovery address.
 * The email includes a time-limited link and never includes the user's password.
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset URL containing the raw reset token
 * @returns {Promise<object>} Nodemailer send result
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
