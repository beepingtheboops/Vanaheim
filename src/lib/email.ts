// Email service using Resend API

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vanaheim <no-reply@thewillsons.com>',
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// Generate magic link email HTML
export function generateMagicLinkEmail(name: string, magicLink: string, isReset: boolean = false): { text: string; html: string } {
  const subject = isReset ? 'Confirm Passkey Reset' : 'Sign In';
  const action = isReset ? 'confirm this passkey reset request' : 'sign in';
  const buttonText = isReset ? 'Confirm Reset & Sign In' : 'Sign In to Vanaheim';
  const additionalText = isReset 
    ? 'After confirming, you\'ll be prompted to setup a new passkey. If you didn\'t request this reset, you can safely ignore this email - your current passkey will remain active.'
    : 'This link will expire in 30 minutes.';

  const text = `Hello ${name},

Click the link below to ${action} to Vanaheim:

${magicLink}

${additionalText}

If you didn't request this, you can safely ignore this email.

— Vanaheim`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      color: #c9a84c;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #c9a84c;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .expiry {
      color: #999;
      font-size: 13px;
      margin-top: 10px;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 12px;
      margin: 20px 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🛡️ Vanaheim</div>
    <div class="content">
      <p>Hello ${name},</p>
      ${isReset ? '<p><strong>A passkey reset has been requested for your account.</strong></p>' : ''}
      <p>Click the button below to ${action} to Vanaheim:</p>
      <div style="text-align: center;">
        <a href="${magicLink}" class="button">${buttonText}</a>
      </div>
      ${isReset ? `
        <div class="warning">
          <strong>⚠️ Important:</strong> Clicking this link will allow you to sign in and setup a new passkey. If you didn't request this reset, you can safely ignore this email - your current passkey will remain active and unchanged.
        </div>
      ` : `
        <p class="expiry">This link will expire in 30 minutes.</p>
      `}
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      — Vanaheim<br>
      Willson Family Command Center
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}
