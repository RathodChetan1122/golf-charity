const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const baseTemplate = (content) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0a0f1e; color: #e8e0d0; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1e2d40; }
  .header { background: linear-gradient(135deg, #0f4c35 0%, #1a7a50 100%); padding: 40px 32px; text-align: center; }
  .header h1 { margin: 0; color: #c8f5d0; font-size: 28px; letter-spacing: 2px; font-weight: 300; }
  .header p { color: #7ecfa0; margin: 8px 0 0; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; }
  .body { padding: 32px; }
  .cta { display: inline-block; background: linear-gradient(135deg, #1a7a50, #0f4c35); color: #c8f5d0 !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; letter-spacing: 1px; }
  .footer { padding: 24px 32px; border-top: 1px solid #1e2d40; text-align: center; color: #4a5568; font-size: 12px; }
  .highlight { color: #4ade80; font-weight: 700; font-size: 20px; }
</style></head>
<body><div class="container">
  <div class="header"><h1>⛳ GOLF CHARITY</h1><p>Play · Win · Give</p></div>
  <div class="body">${content}</div>
  <div class="footer"><p>© ${new Date().getFullYear()} Golf Charity Platform · All rights reserved</p><p>You're receiving this because you're a subscriber. <a href="${process.env.CLIENT_URL}/settings" style="color:#4a5568">Manage preferences</a></p></div>
</div></body></html>`;

exports.sendWelcomeEmail = async (user) => {
  const html = baseTemplate(`
    <h2 style="color:#c8f5d0">Welcome, ${user.firstName}! 🎉</h2>
    <p>You're now part of the Golf Charity community. Subscribe to start entering monthly draws and supporting your chosen charity.</p>
    <a href="${process.env.CLIENT_URL}/subscribe" class="cta">Choose Your Plan →</a>
    <p style="color:#6b7280; font-size:13px">Score your rounds, enter monthly draws, and make every shot count for good.</p>
  `);
  await transporter.sendMail({
    from: `"Golf Charity" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: `Welcome to Golf Charity, ${user.firstName}!`,
    html,
  });
};

exports.sendSubscriptionEmail = async (user, plan) => {
  const html = baseTemplate(`
    <h2 style="color:#c8f5d0">Subscription Activated ✅</h2>
    <p>Your <strong>${plan}</strong> subscription is now active. You're entered into this month's draw!</p>
    <a href="${process.env.CLIENT_URL}/dashboard" class="cta">Go to Dashboard →</a>
  `);
  await transporter.sendMail({
    from: `"Golf Charity" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: 'Your Golf Charity subscription is active',
    html,
  });
};

exports.sendDrawResultEmail = async (user, draw) => {
  const html = baseTemplate(`
    <h2 style="color:#c8f5d0">Draw Results — ${MONTHS[draw.month - 1]} ${draw.year} 🏆</h2>
    <p>The winning numbers are:</p>
    <p class="highlight">${draw.winningNumbers.join(' · ')}</p>
    <p>Log in to see if you're a winner and submit your verification proof.</p>
    <a href="${process.env.CLIENT_URL}/dashboard/winnings" class="cta">Check My Results →</a>
  `);
  await transporter.sendMail({
    from: `"Golf Charity" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: `🏆 Draw Results — ${MONTHS[draw.month - 1]} ${draw.year}`,
    html,
  });
};
