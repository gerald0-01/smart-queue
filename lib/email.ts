import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function emailLayout(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Queue</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F3F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F3F0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#800020;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#D4AF37;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-weight:900;font-size:14px;color:#800020;padding:0 8px;">
                    SQ
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:800;color:#D4AF37;letter-spacing:0.5px;">
                    Smart Queue
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">
                MSU-IIT Document Request System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                This email was sent by Smart Queue — MSU-IIT Document Request System.<br/>
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Verification email ───────────────────────────────────────────────────────
export async function sendVerificationEmail(to: string, token: string) {
    const url = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    const content = `
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;background-color:#D1FAE5;border-radius:50%;margin:0 auto 16px;text-align:center;line-height:64px;font-size:28px;">
          ✉️
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#800020;">Verify Your Email</h1>
        <div style="width:48px;height:3px;background:linear-gradient(90deg,#D4AF37,#B8860B);border-radius:99px;margin:10px auto 0;"></div>
      </div>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Thanks for registering with Smart Queue! Please verify your email address to activate your account.
      </p>

      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
        Click the button below to confirm your email. This link will expire in <strong>24 hours</strong>.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${url}"
          style="display:inline-block;background-color:#800020;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Verify Email Address
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        Or copy and paste this link into your browser:<br/>
        <a href="${url}" style="color:#800020;word-break:break-all;">${url}</a>
      </p>
    `

    await transporter.sendMail({
        from: `"Smart Queue" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: "Smart Queue — Verify Your Email Address",
        html: emailLayout(content),
    });
}

// ─── Password reset email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, token: string) {
    const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const content = `
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;background-color:#FEF3C7;border-radius:50%;margin:0 auto 16px;text-align:center;line-height:64px;font-size:28px;">
          🔑
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#800020;">Reset Your Password</h1>
        <div style="width:48px;height:3px;background:linear-gradient(90deg,#D4AF37,#B8860B);border-radius:99px;margin:10px auto 0;"></div>
      </div>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        We received a request to reset the password for your Smart Queue account.
      </p>

      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
        Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${url}"
          style="display:inline-block;background-color:#800020;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Reset Password
        </a>
      </div>

      <div style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px;margin-top:24px;">
        <p style="margin:0;font-size:13px;color:#92400E;">
          ⚠ If you did not request a password reset, please ignore this email. Your password will not change.
        </p>
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        Or copy and paste this link into your browser:<br/>
        <a href="${url}" style="color:#800020;word-break:break-all;">${url}</a>
      </p>
    `

    await transporter.sendMail({
        from: `"Smart Queue" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: "Smart Queue — Reset Your Password",
        html: emailLayout(content),
    });
}

// ─── Staff verified email ─────────────────────────────────────────────────────
export async function sendStaffVerifiedEmail(to: string) {
    const url = `${process.env.NEXTAUTH_URL}/login`;

    const content = `
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;background-color:#D1FAE5;border-radius:50%;margin:0 auto 16px;text-align:center;line-height:64px;font-size:28px;">
          ✅
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#800020;">Account Verified</h1>
        <div style="width:48px;height:3px;background:linear-gradient(90deg,#D4AF37,#B8860B);border-radius:99px;margin:10px auto 0;"></div>
      </div>

      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Great news! Your Smart Queue staff account has been <strong>verified by an administrator</strong>.
      </p>

      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
        You can now sign in and start managing document requests.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${url}"
          style="display:inline-block;background-color:#800020;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Sign In Now
        </a>
      </div>
    `

    await transporter.sendMail({
        from: `"Smart Queue" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: "Smart Queue — Your Account Has Been Verified",
        html: emailLayout(content),
    });
}
