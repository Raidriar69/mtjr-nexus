import nodemailer from 'nodemailer';

export interface BulkOrderConfirmationParams {
  productTitle: string;
  amount: number;
  currency: string;
  accounts: { email: string; password: string }[];
  instructions?: string;
  orderId: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface OrderConfirmationParams {
  productTitle: string;
  amount: number;
  currency: string;
  accountEmail?: string;
  accountPassword?: string;
  instructions?: string;
  orderId: string;
}

export async function sendBulkOrderConfirmation(
  buyerEmail: string,
  details: BulkOrderConfirmationParams
) {
  const { productTitle, amount, currency, accounts, instructions, orderId } = details;

  const credentialsRows = accounts
    .map(
      (a, i) => `
      <div style="background:#12121a;border:1px solid #4c1d95;border-radius:6px;padding:12px;margin:8px 0;">
        <p style="color:#a78bfa;font-size:12px;font-weight:bold;margin:0 0 6px;">Account #${i + 1}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:13px;"><strong>Email:</strong> ${a.email}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:13px;"><strong>Password:</strong> ${a.password}</p>
      </div>`
    )
    .join('');

  await transporter.sendMail({
    from: `"MTJR Nexus" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: buyerEmail,
    subject: `✅ Order Confirmed — ${productTitle} (×${accounts.length})`,
    html: `<!DOCTYPE html>
<html>
<body style="background:#0a0a0f;font-family:Arial,sans-serif;padding:20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:32px 0 20px;">
      <h1 style="color:#7c3aed;font-size:28px;margin:0;letter-spacing:-0.5px;">MTJR<span style="color:#a78bfa;"> Nexus</span></h1>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Premium Gaming Accounts</p>
    </div>
    <div style="background:#12121a;border-radius:12px;padding:32px;border:1px solid #1e1b4b;">
      <h2 style="color:#e2e8f0;margin:0 0 24px;font-size:22px;">Payment Confirmed!</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Order ID</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">#${orderId.slice(-8).toUpperCase()}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Product</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${productTitle}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Quantity</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${accounts.length}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Amount Paid</td><td style="color:#10b981;font-size:14px;font-weight:bold;text-align:right;">${currency.toUpperCase()} $${(amount / 100).toFixed(2)}</td></tr>
      </table>
      <div style="background:#1a1a2e;border:1px solid #7c3aed;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#a78bfa;margin:0 0 12px;">Your Account Credentials</h3>
        ${credentialsRows}
        ${instructions ? `<p style="color:#94a3b8;margin:16px 0 0;font-size:13px;">${instructions}</p>` : ''}
      </div>
      <p style="color:#64748b;font-size:12px;margin:20px 0 0;line-height:1.6;">
        ⚠️ Keep this email confidential. Never share account credentials.
        By purchasing, you agreed to our Terms of Service and Refund Policy.
      </p>
    </div>
    <p style="color:#334155;text-align:center;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} MTJR Nexus. All rights reserved.</p>
  </div>
</body>
</html>`,
  });
}

export async function sendOrderConfirmation(
  buyerEmail: string,
  details: OrderConfirmationParams
) {
  const { productTitle, amount, currency, accountEmail, accountPassword, instructions, orderId } = details;

  const deliveryHtml = accountEmail
    ? `<div style="background:#1a1a2e;border:1px solid #7c3aed;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#a78bfa;margin:0 0 12px;">Your Account Credentials</h3>
        <p style="color:#e2e8f0;margin:6px 0;"><strong>Email:</strong> ${accountEmail}</p>
        <p style="color:#e2e8f0;margin:6px 0;"><strong>Password:</strong> ${accountPassword}</p>
        ${instructions ? `<p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">${instructions}</p>` : ''}
      </div>`
    : `<div style="background:#1a1a2e;border:1px solid #7c3aed;border-radius:8px;padding:20px;margin:20px 0;">
        <h3 style="color:#a78bfa;margin:0 0 12px;">Delivery Instructions</h3>
        <p style="color:#e2e8f0;">${instructions || 'Your account will be delivered within 24 hours via email.'}</p>
      </div>`;

  await transporter.sendMail({
    from: `"MTJR Nexus" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: buyerEmail,
    subject: `✅ Order Confirmed — ${productTitle}`,
    html: `<!DOCTYPE html>
<html>
<body style="background:#0a0a0f;font-family:Arial,sans-serif;padding:20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:32px 0 20px;">
      <h1 style="color:#7c3aed;font-size:28px;margin:0;letter-spacing:-0.5px;">MTJR<span style="color:#a78bfa;"> Nexus</span></h1>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Premium Gaming Accounts</p>
    </div>
    <div style="background:#12121a;border-radius:12px;padding:32px;border:1px solid #1e1b4b;">
      <h2 style="color:#e2e8f0;margin:0 0 24px;font-size:22px;">Payment Confirmed!</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Order ID</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">#${orderId.slice(-8).toUpperCase()}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Product</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${productTitle}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Amount Paid</td><td style="color:#10b981;font-size:14px;font-weight:bold;text-align:right;">${currency.toUpperCase()} $${(amount / 100).toFixed(2)}</td></tr>
      </table>
      ${deliveryHtml}
      <p style="color:#64748b;font-size:12px;margin:20px 0 0;line-height:1.6;">
        ⚠️ Keep this email confidential. Never share your account credentials with anyone.
        By purchasing, you agreed to our Terms of Service and Refund Policy.
      </p>
    </div>
    <p style="color:#334155;text-align:center;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} MTJR Nexus. All rights reserved.</p>
  </div>
</body>
</html>`,
  });
}
