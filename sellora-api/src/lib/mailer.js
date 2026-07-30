const nodemailer = require('nodemailer');

// --- SMTP transport: Generic SMTP or Gmail fallback ---
const useGenericSmtp = !!process.env.SMTP_HOST;

const transporter = useGenericSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password, not your normal password
      },
    });

/** Returns the sender email address based on which SMTP config is active */
function getSenderEmail() {
  return useGenericSmtp ? process.env.SMTP_USER : process.env.GMAIL_USER;
}

// --- Shared brand constants ---
const BRAND = {
  name: 'Sellora',
  primaryColor: '#0f766e',       // teal-700
  primaryLight: '#14b8a6',      // teal-500
  bgSoft: '#f0fdfa',            // teal-50
  bgCard: '#ffffff',
  textDark: '#1e293b',          // slate-800
  textMuted: '#64748b',         // slate-500
  textLight: '#94a3b8',         // slate-400
  borderColor: '#e2e8f0',       // slate-200
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

function logoUrl() {
  return process.env.APP_LOGO_URL || 'http://localhost:4000/uploads/sellora-logo.png';
}

// --- Reusable layout wrapper ---
function layoutWrapper(bodyContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${BRAND.fontFamily};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Main card -->
        <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background-color:${BRAND.bgCard};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);" cellpadding="0" cellspacing="0">
          <!-- Teal accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${BRAND.primaryColor},${BRAND.primaryLight});"></td>
          </tr>

          <!-- Logo + Brand -->
          <tr>
            <td style="padding:32px 32px 8px 32px;text-align:center;">
              <img src="${logoUrl()}" alt="${BRAND.name}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;margin-bottom:8px;" />
              <h1 style="margin:0;font-size:20px;font-weight:700;color:${BRAND.textDark};letter-spacing:-0.3px;">${BRAND.name}</h1>
              <p style="margin:4px 0 0 0;font-size:12px;color:${BRAND.textLight};letter-spacing:0.15em;text-transform:uppercase;">Buyer · Seller · Partner</p>
            </td>
          </tr>

          ${bodyContent}

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 32px 32px;text-align:center;">
              <hr style="border:none;border-top:1px solid ${BRAND.borderColor};margin-bottom:16px;" />
              <p style="margin:0;font-size:12px;color:${BRAND.textLight};line-height:1.6;">
                ${BRAND.name} &mdash; Multi-vendor marketplace<br />
                <span style="font-size:11px;">If you didn't request this email, you can safely ignore it.</span>
              </p>
            </td>
          </tr>
        </table>
        <!-- Tiny disclaimer -->
        <p style="margin-top:16px;font-size:11px;color:${BRAND.textLight};max-width:400px;">
          This is an automated message from ${BRAND.name}. Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- 1. OTP Verification Email ---
async function sendOtpEmail(toEmail, name, otp) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Verify your email</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${name},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                Use the verification code below to complete your registration.
              </p>
              <!-- OTP display -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:20px 24px;width:100%;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px 0;font-size:11px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Verification code</p>
                    <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:10px;color:${BRAND.primaryColor};font-family:monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
                ⏱ This code expires in <strong>10 minutes</strong>. If you didn't create an account, please ignore this email.
              </p>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: toEmail,
    subject: `Your ${BRAND.name} verification code`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 2. Password Reset Email ---
async function sendPasswordResetEmail(toEmail, name, resetLink) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Reset your password</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${name},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                We received a request to reset your password. Click the button below to set a new one.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center" style="padding:8px 0 16px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${resetLink}" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            🔒 Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.primaryColor};word-break:break-all;background:${BRAND.bgSoft};padding:12px;border-radius:8px;font-family:monospace;">
                ${resetLink}
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
                ⏱ This link expires in <strong>30 minutes</strong>. If you didn't request a password reset, please ignore this email.
              </p>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: toEmail,
    subject: `Reset your ${BRAND.name} password`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 3. Password Reset Success Confirmation Email (NEW) ---
async function sendPasswordResetSuccessEmail(toEmail, name) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <!-- Success checkmark icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">✅</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Password updated</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${name},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                Your password has been successfully changed. You can now log in with your new password.
              </p>
              <!-- Info box -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;font-size:13px;color:${BRAND.textDark};font-weight:600;">🔔 Didn't do this?</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
                      If you didn't change your password, please <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/forgot-password" style="color:${BRAND.primaryColor};font-weight:600;text-decoration:underline;">reset it immediately</a> and contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Login CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            Log in to ${BRAND.name}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: toEmail,
    subject: `Your ${BRAND.name} password has been changed`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 4. Email Added / Updated Notification Email ---
async function sendEmailAddedNotification(toEmail, name) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <!-- Info icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">📧</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Email updated</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${name},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                Your email address has been successfully added or updated on your ${BRAND.name} account.
              </p>
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                If you did not make this change, please contact our support team immediately.
              </p>
              <!-- Info box -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;font-size:13px;color:${BRAND.textDark};font-weight:600;">🔔 Security tip</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">
                      Keep your account secure by using a strong, unique password and enabling two-factor authentication when available.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: toEmail,
    subject: `Your ${BRAND.name} email has been updated`,
    html: layoutWrapper(bodyContent),
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail, sendEmailAddedNotification };
