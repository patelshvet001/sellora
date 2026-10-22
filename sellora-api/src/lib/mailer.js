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

// --- 5. Order Placed Confirmation Email (full details) ---
async function sendOrderPlacedEmail(customerEmail, customerName, order) {
  const itemsHtml = order.items.map(it => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.borderColor};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:${BRAND.textDark};font-weight:600;">${it.product?.name || 'Product'}</td>
            <td style="font-size:13px;color:${BRAND.textMuted};text-align:center;">× ${it.quantity}</td>
            <td style="font-size:13px;color:${BRAND.textDark};font-weight:600;text-align:right;">₹${Number(it.lineTotal).toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">🎉</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};text-align:center;">Order Placed Successfully!</h2>
              <p style="margin:0 0 4px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">Hi ${customerName},</p>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">Your order <strong style="color:${BRAND.primaryColor};">${order.orderNumber}</strong> has been placed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <!-- Order Summary Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Order Summary</td></tr>
                ${itemsHtml}
                <tr>
                  <td style="padding-top:12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:${BRAND.textMuted};">Delivery Fee</td>
                        <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;">${Number(order.deliveryFee) === 0 ? 'FREE' : '₹' + Number(order.deliveryFee).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:${BRAND.textMuted};padding-top:4px;">Discount</td>
                        <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-top:4px;">${Number(order.discount) > 0 ? '-₹' + Number(order.discount).toFixed(2) : '—'}</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px;font-weight:700;color:${BRAND.textDark};padding-top:8px;border-top:2px solid ${BRAND.borderColor};">Total Paid</td>
                        <td style="font-size:16px;font-weight:700;color:${BRAND.primaryColor};text-align:right;padding-top:8px;border-top:2px solid ${BRAND.borderColor};">₹${Number(order.total).toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Delivery Address -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr>
                  <td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:6px;">📍 Delivery Address</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textDark};line-height:1.6;">
                    ${order.address?.line1 || ''}${order.address?.line2 ? ', ' + order.address.line2 : ''}<br/>
                    ${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}
                  </td>
                </tr>
              </table>

              <!-- Payment Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:6px;">💳 Payment</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textDark};">
                    Method: <strong>${order.payment?.method || 'COD'}</strong><br/>
                    Status: <strong>${order.payment?.status || 'PENDING'}</strong>
                  </td>
                </tr>
              </table>

              <!-- Track CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${order.id}" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            Track Your Order
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;text-align:center;">
                You'll receive email updates as your order status changes.
              </p>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: customerEmail,
    subject: `Order Confirmed · ${order.orderNumber}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 6. Order Status Update Email ---
async function sendOrderStatusEmail(customerEmail, customerName, order) {
  const statusEmojis = {
    CONFIRMED: '✅',
    PACKED: '📦',
    OUT_FOR_DELIVERY: '🛵',
    DELIVERED: '🎉',
    CANCELLED: '❌',
    RETURNED: '🔄',
    PENDING: '⏳',
  };

  const statusDescriptions = {
    CONFIRMED: 'Your order has been confirmed and is being processed.',
    PACKED: 'Your items have been packed and are ready for delivery.',
    OUT_FOR_DELIVERY: 'Your order is out for delivery and will reach you soon!',
    DELIVERED: 'Your order has been delivered. Thank you for shopping with us!',
    CANCELLED: 'Your order has been cancelled. If you didn\'t request this, contact support.',
    RETURNED: 'Your return has been processed. Refund will be initiated shortly.',
    PENDING: 'Your order is pending confirmation.',
  };

  const emoji = statusEmojis[order.status] || '📋';
  const description = statusDescriptions[order.status] || `Your order is now ${order.status.replace(/_/g, ' ').toLowerCase()}.`;

  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">${emoji}</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Order Update</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${customerName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <!-- Status Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:20px 24px;width:100%;margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px 0;font-size:11px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Current Status</p>
                    <p style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:${BRAND.primaryColor};">${order.status.replace(/_/g, ' ')}</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">${description}</p>
                  </td>
                </tr>
              </table>

              <!-- Order Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};">Order Number</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:6px;">Items</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-top:6px;">${order.items?.length || 0} item(s)</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:6px;">Total</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:700;padding-top:6px;">₹${Number(order.total).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Track CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${order.id}" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            View Order Details
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
    to: customerEmail,
    subject: `${emoji} Order ${order.status.replace(/_/g, ' ')} · ${order.orderNumber}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 7. Booking Requested Confirmation Email ---
async function sendBookingRequestedEmail(customerEmail, customerName, booking) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">📅</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Booking Requested</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${customerName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                Your booking <strong style="color:${BRAND.primaryColor};">${booking.bookingNo}</strong> has been submitted. The service provider will confirm it shortly.
              </p>

              <!-- Booking Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Booking Details</td></tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Service</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${booking.service?.title || 'Service'}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Provider</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${booking.service?.provider?.businessName || 'Provider'}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Scheduled</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${new Date(booking.scheduledAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Price</td>
                  <td style="font-size:13px;color:${BRAND.primaryColor};text-align:right;font-weight:700;padding-bottom:4px;">₹${Number(booking.price).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:4px;">Address</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-top:4px;">${booking.address}, ${booking.city} - ${booking.pincode}</td>
                </tr>
              </table>

              <!-- Track CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            View My Bookings
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;color:${BRAND.textMuted};line-height:1.5;text-align:center;">
                We'll notify you when the provider responds.
              </p>
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: customerEmail,
    subject: `Booking Confirmed · ${booking.bookingNo}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 8. Booking Status Update Email ---
async function sendBookingStatusEmail(customerEmail, customerName, booking) {
  const statusEmojis = {
    REQUESTED: '📅',
    ACCEPTED: '✅',
    IN_PROGRESS: '🔧',
    COMPLETED: '🎉',
    CANCELLED: '❌',
    REJECTED: '🚫',
  };

  const statusDescriptions = {
    REQUESTED: 'Your booking has been submitted and is waiting for provider confirmation.',
    ACCEPTED: 'Your booking has been accepted! The provider will arrive at the scheduled time.',
    IN_PROGRESS: 'The service is currently in progress.',
    COMPLETED: 'The service has been completed. Thank you for using Sellora!',
    CANCELLED: 'Your booking has been cancelled.',
    REJECTED: 'Unfortunately, the provider was unable to accept your booking.',
  };

  const emoji = statusEmojis[booking.status] || '📋';
  const description = statusDescriptions[booking.status] || `Your booking is now ${booking.status.toLowerCase()}.`;

  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">${emoji}</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Booking Update</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${customerName},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <!-- Status Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:20px 24px;width:100%;margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px 0;font-size:11px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Current Status</p>
                    <p style="margin:0 0 4px 0;font-size:22px;font-weight:700;color:${BRAND.primaryColor};">${booking.status.replace(/_/g, ' ')}</p>
                    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5;">${description}</p>
                  </td>
                </tr>
              </table>

              <!-- Booking Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};">Booking No</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;">${booking.bookingNo}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:6px;">Service</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-top:6px;">${booking.service?.title || 'Service'}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:6px;">Scheduled</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-top:6px;">${new Date(booking.scheduledAt).toLocaleString()}</td>
                </tr>
              </table>

              <!-- View CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/bookings" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            View My Bookings
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
    to: customerEmail,
    subject: `${emoji} Booking ${booking.status.replace(/_/g, ' ')} · ${booking.bookingNo}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 9. Vendor Order Notification Email ---
async function sendVendorOrderNotification(vendorEmail, vendorName, order, vendorItems) {
  const itemsHtml = vendorItems.map(it => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid ${BRAND.borderColor};font-size:13px;color:${BRAND.textDark};">${it.product?.name || 'Product'} × ${it.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px solid ${BRAND.borderColor};font-size:13px;color:${BRAND.textDark};text-align:right;">₹${Number(it.lineTotal).toFixed(2)}</td>
    </tr>
  `).join('');

  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">🏪</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};text-align:center;">New Order Received!</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">Hi ${vendorName},</p>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">You've received a new order <strong style="color:${BRAND.primaryColor};">${order.orderNumber}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <!-- Items -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Your Items in this Order</td></tr>
                ${itemsHtml}
              </table>

              <!-- Customer Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:6px;">👤 Customer</td></tr>
                <tr><td style="font-size:13px;color:${BRAND.textDark};">${order.customer?.name || 'Customer'}</td></tr>
              </table>

              <!-- Action needed -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td style="font-size:12px;font-weight:600;color:${BRAND.textDark};">⚡ Action Required</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:4px;line-height:1.5;">
                    Please confirm and process this order from your vendor dashboard to keep the customer updated.
                  </td>
                </tr>
              </table>

              <!-- Dashboard CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/vendor/dashboard" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            Go to Vendor Dashboard
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
    to: vendorEmail,
    subject: `🏪 New Order Received · ${order.orderNumber}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 10. Provider Booking Notification Email ---
async function sendProviderBookingNotification(providerEmail, providerName, booking) {
  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">🧰</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};text-align:center;">New Booking Request!</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">Hi ${providerName},</p>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;text-align:center;">A customer has booked your service <strong style="color:${BRAND.primaryColor};">${booking.service?.title || 'Service'}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <!-- Booking Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Booking Details</td></tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Booking No</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${booking.bookingNo}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Service</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${booking.service?.title || 'Service'}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Scheduled</td>
                  <td style="font-size:13px;color:${BRAND.textDark};text-align:right;font-weight:600;padding-bottom:4px;">${new Date(booking.scheduledAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-bottom:4px;">Price</td>
                  <td style="font-size:13px;color:${BRAND.primaryColor};text-align:right;font-weight:700;padding-bottom:4px;">₹${Number(booking.price).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BRAND.borderColor};border-radius:12px;padding:16px 20px;width:100%;margin-bottom:16px;">
                <tr><td style="font-size:12px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.1em;padding-bottom:6px;">👤 Customer</td></tr>
                <tr><td style="font-size:13px;color:${BRAND.textDark};">${booking.customer?.name || 'Customer'} ${booking.customer?.phone ? '· ' + booking.customer.phone : ''}</td></tr>
                <tr><td style="font-size:13px;color:${BRAND.textMuted};padding-top:4px;">📍 ${booking.address}, ${booking.city} - ${booking.pincode}</td></tr>
              </table>

              <!-- Action needed -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:16px 20px;width:100%;">
                <tr>
                  <td style="font-size:12px;font-weight:600;color:${BRAND.textDark};">⚡ Action Required</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:${BRAND.textMuted};padding-top:4px;line-height:1.5;">
                    Please accept or reject this booking from your provider dashboard.
                  </td>
                </tr>
              </table>

              <!-- Dashboard CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/provider/bookings" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            View Bookings
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
    to: providerEmail,
    subject: `🧰 New Booking · ${booking.bookingNo}`,
    html: layoutWrapper(bodyContent),
  });
}

// --- 11. Account Approval Status Email ---
async function sendApprovalStatusEmail(toEmail, name, role, isApproved) {
  const roleLabel = role === 'VENDOR' ? 'Vendor' : role === 'SERVICE_PROVIDER' ? 'Service Provider' : 'Delivery Partner';
  const statusEmoji = isApproved ? '✅' : '⏳';
  const statusText = isApproved ? 'Approved' : 'Under Review';

  const bodyContent = `
          <tr>
            <td style="padding:24px 32px 8px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td style="width:64px;height:64px;border-radius:50%;background:${BRAND.bgSoft};text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:64px;">${statusEmoji}</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:600;color:${BRAND.textDark};">Account ${statusText}</h2>
              <p style="margin:0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">Hi ${name},</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;color:${BRAND.textMuted};line-height:1.6;">
                ${isApproved
                  ? `Congratulations! Your <strong>${roleLabel}</strong> account has been approved. You can now start using Sellora to its full potential.`
                  : `Your <strong>${roleLabel}</strong> account is currently under review. We'll notify you once it's approved.`}
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="background:${BRAND.bgSoft};border-radius:12px;padding:20px 24px;width:100%;margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 4px 0;font-size:11px;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Account Type</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.primaryColor};">${roleLabel}</p>
                    <p style="margin:8px 0 0 0;font-size:12px;color:${BRAND.textMuted};">
                      Status: <strong>${statusText}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              ${isApproved ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-radius:8px;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryLight});">
                      <tr>
                        <td style="padding:14px 32px;border-radius:8px;">
                          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login" style="display:inline-block;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                            Log In to Get Started
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : ''}
            </td>
          </tr>`;

  await transporter.sendMail({
    from: `"${BRAND.name}" <${getSenderEmail()}>`,
    to: toEmail,
    subject: `${statusEmoji} ${roleLabel} Account ${statusText} on Sellora`,
    html: layoutWrapper(bodyContent),
  });
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendEmailAddedNotification,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
  sendBookingRequestedEmail,
  sendBookingStatusEmail,
  sendVendorOrderNotification,
  sendProviderBookingNotification,
  sendApprovalStatusEmail,
};
