import SibApiV3Sdk from "sib-api-v3-sdk";

/**
 * Sends password reset email using Brevo API.
 */
export async function sendPasswordResetEmail(to, resetLink) {
  try {
    console.log("[EMAIL] Sending reset email to:", to);

    const defaultClient = SibApiV3Sdk.ApiClient.instance;

    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    await apiInstance.sendTransacEmail({
      sender: {
        name: "Chat Buddy",
        email: "rohanbanghsingps4@gmail.com",
      },

      to: [
        {
          email: to,
        },
      ],

      subject: "Chat Buddy Password Reset",

      textContent: `Hello,

You requested a password reset for your Chat Buddy account.

Click the link below:

${resetLink}

This link expires in 15 minutes.

If you did not request this reset, please ignore this email.`,
    });

    console.log("[EMAIL] Email sent successfully");
  } catch (error) {
    console.error(
      "[EMAIL] Email send failed:",
      error?.response?.body || error.message
    );

    throw error;
  }
}