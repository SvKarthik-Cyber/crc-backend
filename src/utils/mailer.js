const { Resend } = require('resend');
const env = require('../config/env');

const resend = new Resend(env.resendApiKey);

// Sent once, when staff approve a registration (see
// approvePoliceVerification in controllers/auth.controller.js). Contains the
// one-time temporary password the applicant must use on their first login,
// after which the backend forces them through /auth/change-password.
async function sendApprovalEmail({ to, name, temporaryPassword }) {
  const { error } = await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject: 'Your Cybersecurity Resilience Centre account has been approved',
    html: `
      <p>Hi ${name},</p>
      <p>Your registration has been approved. You can now log in using the temporary password below:</p>
      <p style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">${temporaryPassword}</p>
      <p>You will be required to set a new password immediately after logging in. This temporary
      password is single-use - keep it private and do not forward this email.</p>
      <p>If you did not request this account, please disregard this message.</p>
    `,
  });

  if (error) {
    // Don't let a mail-provider outage block the approval itself - the
    // caller still returns the temporary password in the API response as a
    // fallback so staff can relay it manually.
    console.error('Failed to send approval email:', error);
    return { sent: false, error };
  }

  return { sent: true };
}

module.exports = { sendApprovalEmail };