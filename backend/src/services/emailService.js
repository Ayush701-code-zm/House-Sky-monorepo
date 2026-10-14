const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'info@houseandsky.com';
const SMTP_PASS = process.env.SMTP_PASS || 'HRX6PVTAcq;9LsJ';

const DEFAULT_ADMIN_URL = process.env.ADMIN_URL || 'https://admin.houseandsky.com';
const DEFAULT_LANDING_URL = process.env.LANDING_URL || 'https://www.houseandsky.com';

// Create Nodemailer Transporter using Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Hostinger SMTP connection failed:', error.message);
  } else {
    console.log('✅ Hostinger SMTP Server is ready to send emails (info@houseandsky.com)');
  }
});

const toOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
};

// Only trusted front-end origins may be used to build emailed links. The
// Origin/Referer header is client-controlled, so trusting it blindly would let
// an attacker request a reset for a victim and receive the token on their own host.
const TRUSTED_ORIGINS = new Set(
  [DEFAULT_ADMIN_URL, DEFAULT_LANDING_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
    .map((o) => toOrigin(o.trim()))
    .filter(Boolean)
);

const getBaseUrl = (clientOrigin, role) => {
  // clientOrigin may be a Referer (full URL incl. path, e.g. /owner-login?x=1);
  // reduce it to scheme://host so links don't become /owner-login/verify-email.
  const origin = clientOrigin ? toOrigin(clientOrigin) : null;
  if (origin && TRUSTED_ORIGINS.has(origin) && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return origin;
  }
  if (role === 'PROPERTY_OWNER' || role === 'USER') {
    return DEFAULT_LANDING_URL.replace(/\/$/, '');
  }
  return DEFAULT_ADMIN_URL.replace(/\/$/, '');
};

/**
 * Send Email Verification link to User/Agent
 */
const sendVerificationEmail = async ({ toEmail, fullName, token, clientOrigin, role }) => {
  const baseUrl = getBaseUrl(clientOrigin, role);
  const verifyLink = `${baseUrl}/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - House & Sky</title>
    </head>
    <body style="margin:0; padding:0; background-color:#FDFCF0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed; background-color:#FDFCF0; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 15px rgba(0,0,0,0.06);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color:#0B4F3C; padding: 32px 20px;">
                  <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; font-family:Georgia, serif; letter-spacing:0.5px;">House & Sky</h1>
                  <p style="margin:6px 0 0 0; color:#C9A96E; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">Building Trust. Delivering Value.</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 35px 30px; color:#1a202c; font-size:15px; line-height:1.6;">
                  <h2 style="margin-top:0; color:#0B4F3C; font-size:20px; font-weight:700;">Verify Your Email Address</h2>
                  <p style="margin:0 0 16px 0;">Hello <strong>${fullName || 'User'}</strong>,</p>
                  <p style="margin:0 0 24px 0; color:#4a5568;">Thank you for registering with House & Sky. Please click the button below to verify your email address and activate your account access:</p>
                  
                  <!-- Bulletproof Inline Styled Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                    <tr>
                      <td align="center">
                        <a href="${verifyLink}" target="_blank" style="background-color:#0B4F3C; color:#ffffff; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; text-decoration:none; padding:16px 36px; border-radius:10px; border:1px solid #0B4F3C; text-align:center; box-shadow: 0 4px 12px rgba(11,79,60,0.25);">
                          Verify Email Address &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 8px 0; font-size:13px; color:#718096; font-weight:600;">Or copy and paste this verification link into your browser:</p>
                  <div style="background-color:#FDFCF0; border:1px dashed #0B4F3C; padding:12px 14px; font-family:Consolas, Monaco, monospace; font-size:13px; color:#0B4F3C; word-break:break-all; border-radius:8px; line-height:1.4;">
                    <a href="${verifyLink}" target="_blank" style="color:#0B4F3C; text-decoration:underline;">${verifyLink}</a>
                  </div>

                  <p style="font-size:12px; color:#a0aec0; margin: 30px 0 0 0; line-height:1.5;">
                    Note: This link will expire in 24 hours. If you did not create an account with House & Sky, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color:#f8fafc; padding:20px; font-size:12px; color:#64748b; border-top:1px solid #e2e8f0; line-height:1.5;">
                  &copy; ${new Date().getFullYear()} House & Sky. All rights reserved.<br/>
                  Need help? Contact <a href="mailto:info@houseandsky.com" style="color:#0B4F3C; text-decoration:none; font-weight:bold;">info@houseandsky.com</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"House & Sky" <${SMTP_USER}>`,
    to: toEmail,
    subject: 'Action Required: Verify Your Email - House & Sky',
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset Link to User/Agent
 */
const sendPasswordResetEmail = async ({ toEmail, fullName, token, clientOrigin, role }) => {
  const baseUrl = getBaseUrl(clientOrigin, role);
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - House & Sky</title>
    </head>
    <body style="margin:0; padding:0; background-color:#FDFCF0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed; background-color:#FDFCF0; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 15px rgba(0,0,0,0.06);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color:#0B4F3C; padding: 32px 20px;">
                  <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; font-family:Georgia, serif; letter-spacing:0.5px;">House & Sky</h1>
                  <p style="margin:6px 0 0 0; color:#C9A96E; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">Building Trust. Delivering Value.</p>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 35px 30px; color:#1a202c; font-size:15px; line-height:1.6;">
                  <h2 style="margin-top:0; color:#0B4F3C; font-size:20px; font-weight:700;">Reset Your Password</h2>
                  <p style="margin:0 0 16px 0;">Hello <strong>${fullName || 'User'}</strong>,</p>
                  <p style="margin:0 0 24px 0; color:#4a5568;">We received a request to reset your password for your House & Sky account. Click the button below to set up a new password:</p>
                  
                  <!-- Bulletproof Inline Styled Button -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" target="_blank" style="background-color:#0B4F3C; color:#ffffff; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:15px; font-weight:bold; text-decoration:none; padding:16px 36px; border-radius:10px; border:1px solid #0B4F3C; text-align:center; box-shadow: 0 4px 12px rgba(11,79,60,0.25);">
                          Reset Password &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 8px 0; font-size:13px; color:#718096; font-weight:600;">Or copy and paste this link into your browser:</p>
                  <div style="background-color:#FDFCF0; border:1px dashed #0B4F3C; padding:12px 14px; font-family:Consolas, Monaco, monospace; font-size:13px; color:#0B4F3C; word-break:break-all; border-radius:8px; line-height:1.4;">
                    <a href="${resetLink}" target="_blank" style="color:#0B4F3C; text-decoration:underline;">${resetLink}</a>
                  </div>

                  <p style="font-size:12px; color:#a0aec0; margin: 30px 0 0 0; line-height:1.5;">
                    Note: This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color:#f8fafc; padding:20px; font-size:12px; color:#64748b; border-top:1px solid #e2e8f0; line-height:1.5;">
                  &copy; ${new Date().getFullYear()} House & Sky. All rights reserved.<br/>
                  Need help? Contact <a href="mailto:info@houseandsky.com" style="color:#0B4F3C; text-decoration:none; font-weight:bold;">info@houseandsky.com</a>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"House & Sky" <${SMTP_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request - House & Sky',
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
