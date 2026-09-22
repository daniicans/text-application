const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');

const PLATFORM_LABELS = {
  gmail: 'Gmail',
  yahoo: 'Yahoo Mail',
  m365: 'Microsoft 365 / Outlook',
  sendgrid: 'SendGrid',
  webmail: 'Webmail',
  outlook: 'Outlook / Hotmail',
  icloud: 'iCloud Mail',
  'custom-domain': 'Custom domain email',
  other: 'Other',
};

const PROVIDER_LABELS = {
  godaddy: 'GoDaddy',
  namecheap: 'Namecheap',
  cloudflare: 'Cloudflare',
  squarespace: 'Squarespace',
  wix: 'Wix',
  hostinger: 'Hostinger',
  other: 'Other',
};

function pwLabel(platform) {
  if (platform === 'sendgrid') return 'Password (API Key)';
  if (platform === 'yahoo' || platform === 'gmail') return 'App Password';
  if (platform === 'webmail') return 'Email Password';
  return 'Password';
}

// Mirrors the texting application's PDF layout (index.html generateApplicationPDF),
// generated server-side since the app password never touches the success page.
function generateSignupPDF(s) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const W = 215.9;
  const MARGIN = 18;
  let y = 0;

  doc.setFillColor(73, 74, 125);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('icans · iChat Beta Signup', MARGIN, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Submitted ' + new Date().toLocaleString(), W - MARGIN, 17, { align: 'right' });

  y = 40;

  const sectionHeader = (title) => {
    doc.setFillColor(236, 250, 238);
    doc.rect(MARGIN - 2, y - 5, W - (MARGIN * 2) + 4, 9, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 144, 57);
    doc.text(title.toUpperCase(), MARGIN, y + 0.5);
    doc.setTextColor(26, 24, 48);
    y += 11;
  };

  const row = (label, value) => {
    if (!value) return;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(73, 74, 125);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 24, 48);
    const lines = doc.splitTextToSize(String(value), W - MARGIN - 78);
    doc.text(lines, 78, y);
    y += lines.length > 1 ? lines.length * 5.5 + 1 : 7;
  };

  const divider = () => {
    doc.setDrawColor(228, 226, 238);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 5;
  };

  sectionHeader('Beta Signup');
  row('Signup Number', `#${s.seatNumber}`);
  row('Plus Plan Confirmed', s.planConfirmed ? 'Yes (verify against account)' : 'No');

  y += 4;

  sectionHeader('Account & Contact');
  row('Full Name', s.fullName);
  row('Company Name', s.companyName);
  row('Account Email', s.email);

  y += 4;

  sectionHeader('Email Setup');
  row('Send & Receive Email', s.mainEmail);
  row('Email Platform', PLATFORM_LABELS[s.emailPlatform] || s.emailPlatform);
  if (s.usesCustomDomain) {
    divider();
    row('Domain', s.domain);
    row('iChat Subdomain', 'ichat.' + s.domain);
    row('Domain Carrier', PROVIDER_LABELS[s.domainProvider] || s.domainProvider);
    row('Delegated to webdev@icans.ai', s.delegationOk ? 'Yes' : 'No');
  } else {
    divider();
    row('Provider Name', s.providerName);
    row('SMTP Server', s.smtpServer);
    row('SMTP Port', s.smtpPort);
    row('Username', s.smtpUsername);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 90, 14);
    doc.text('SENSITIVE — DELETE THIS PDF AFTER SETUP', MARGIN, y);
    doc.setTextColor(26, 24, 48);
    y += 6;
    row(pwLabel(s.emailPlatform), s.appPassword);
  }

  const pageH = 279.4;
  doc.setFillColor(244, 243, 248);
  doc.rect(0, pageH - 18, W, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 106, 147);
  doc.text('icans.ai  ·  iChat Beta  ·  Confidential — for icans staff only', MARGIN, pageH - 8);

  return doc.output('datauristring').split(',')[1];
}

function escapeHtml(v) {
  return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailHtml(s) {
  const rowHtml = (label, value) =>
    `<div class="row"><span class="label">${label}</span><span class="value">${value || '<span class="empty">Not provided</span>'}</span></div>`;

  const setupRows = s.usesCustomDomain
    ? rowHtml('Domain', escapeHtml(s.domain)) +
      rowHtml('iChat Subdomain', escapeHtml('ichat.' + s.domain)) +
      rowHtml('Domain Carrier', escapeHtml(PROVIDER_LABELS[s.domainProvider] || s.domainProvider)) +
      rowHtml('Delegated to webdev@icans.ai', s.delegationOk ? 'Yes' : 'No')
    : (s.providerName ? rowHtml('Provider Name', escapeHtml(s.providerName)) : '') +
      (s.smtpServer ? rowHtml('SMTP Server', escapeHtml(s.smtpServer)) : '') +
      (s.smtpPort ? rowHtml('SMTP Port', escapeHtml(s.smtpPort)) : '') +
      (s.smtpUsername ? rowHtml('Username', escapeHtml(s.smtpUsername)) : '') +
      `<div class="pw-block">
         <p class="pw-warn">SENSITIVE — needed to connect their inbox. Delete this email after setup.</p>
         ${rowHtml(pwLabel(s.emailPlatform), `<code>${escapeHtml(s.appPassword)}</code>`)}
       </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1A1830; margin: 0; padding: 0; background: #F4F3F8; }
  .wrapper { max-width: 620px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(73,74,125,0.12); }
  .header { background: #494A7D; color: white; padding: 28px 36px; }
  .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .header p { margin: 0; font-size: 13px; opacity: 0.75; }
  .body { padding: 28px 36px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2E9039; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #ECFAEE; }
  .row { display: flex; gap: 12px; margin-bottom: 10px; }
  .label { width: 180px; flex-shrink: 0; font-size: 12px; font-weight: 600; color: #6E6A93; padding-top: 1px; }
  .value { font-size: 13px; color: #1A1830; font-weight: 500; flex: 1; }
  .value.empty, .empty { color: #B5B2C9; font-style: italic; font-weight: 400; }
  .value code { background: #F4F3F8; border: 1px solid #E8E7EE; border-radius: 6px; padding: 2px 8px; font-size: 13px; }
  .seat-badge { display: inline-block; background: #ECFAEE; color: #2E9039; border: 1px solid #D6F3DA; padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; }
  .pw-block { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; padding: 12px 14px; }
  .pw-warn { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #C75A0E; }
  .footer { background: #F4F3F8; padding: 16px 36px; font-size: 11px; color: #6E6A93; border-top: 1px solid #E8E7EE; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>New iChat Beta Signup</h1>
    <p>Submitted ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>
  <div class="body">
    <div class="section">
      <p class="section-title">Beta Signup</p>
      ${rowHtml('Signup', `<span class="seat-badge">Signup #${s.seatNumber}</span>`)}
      ${rowHtml('Plus Plan Confirmed', s.planConfirmed ? 'Yes — verify against account' : 'No')}
    </div>
    <div class="section">
      <p class="section-title">Account &amp; Contact</p>
      ${rowHtml('Full Name', s.fullName)}
      ${rowHtml('Company Name', s.companyName)}
      ${rowHtml('Account Email', s.email)}
    </div>
    <div class="section">
      <p class="section-title">Email Setup</p>
      ${rowHtml('Send &amp; Receive Email', s.mainEmail)}
      ${rowHtml('Email Platform', PLATFORM_LABELS[s.emailPlatform] || s.emailPlatform)}
      ${setupRows}
    </div>
  </div>
  <div class="footer">
    icans.ai &nbsp;·&nbsp; iChat Beta &nbsp;·&nbsp; Confidential — for icans staff only<br>PDF signup sheet attached.
  </div>
</div>
</body>
</html>`;
}

// Sends the notification email (with PDF) and pushes the signup to iCore.
// Never throws — a notification failure must not cost the customer their seat.
// Returns per-step error strings for observability.
async function notifySignup(s) {
  const result = { pdf: null, email: null, icore: null };
  let pdfBase64 = null;
  try {
    pdfBase64 = generateSignupPDF(s);
  } catch (e) {
    result.pdf = e.message;
    console.error('ichat PDF generation failed:', e.message);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const safeName = (s.companyName || 'signup').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 60);
    await transporter.sendMail({
      from: `"icans Applications" <${process.env.GMAIL_USER}>`,
      replyTo: s.email || undefined,
      to: process.env.TO_EMAIL || 'onboarding@icans.ai',
      subject: `New iChat Beta Signup — ${s.companyName} · Signup #${s.seatNumber}`,
      html: buildEmailHtml(s),
      text: [
        `New iChat Beta Signup — ${s.companyName}`,
        `Signup: #${s.seatNumber}`,
        `Plus plan confirmed: ${s.planConfirmed ? 'Yes' : 'No'}`,
        `Name: ${s.fullName}`,
        `Account email: ${s.email}`,
        `Send/receive email: ${s.mainEmail}`,
        `Platform: ${PLATFORM_LABELS[s.emailPlatform] || s.emailPlatform}`,
        s.usesCustomDomain
          ? `Domain: ${s.domain} (ichat.${s.domain}) · Carrier: ${PROVIDER_LABELS[s.domainProvider] || s.domainProvider} · Delegated: ${s.delegationOk ? 'Yes' : 'No'}`
          : [
              s.providerName ? `Provider: ${s.providerName}` : '',
              s.smtpServer ? `SMTP: ${s.smtpServer}:${s.smtpPort}` : '',
              s.smtpUsername ? `Username: ${s.smtpUsername}` : '',
              `Password (sensitive, delete after setup): ${s.appPassword}`,
            ].filter(Boolean).join('\n'),
      ].join('\n'),
      attachments: pdfBase64
        ? [{
            filename: `iChatBeta-${safeName}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            contentType: 'application/pdf',
          }]
        : [],
    });
  } catch (e) {
    result.email = e.message;
    console.error('ichat signup email failed:', e.message);
  }

  try {
    // App password intentionally excluded from the iCore payload — it lives
    // in the notification email/PDF and encrypted in Supabase.
    const icoreRes = await fetch('https://icore.icans.ai/api/webhooks/ichat-beta', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.ICORE_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        data: {
          type: 'ichat-beta-signup',
          seatNumber: s.seatNumber,
          fullName: s.fullName,
          companyName: s.companyName,
          email: s.email,
          mainEmail: s.mainEmail,
          emailPlatform: s.emailPlatform,
          usesCustomDomain: s.usesCustomDomain,
          domain: s.domain || null,
          domainProvider: s.domainProvider || null,
          delegationOk: s.delegationOk,
          planConfirmed: s.planConfirmed,
          smtpUsername: s.smtpUsername || null,
          smtpProviderName: s.providerName || null,
          smtpServer: s.smtpServer || null,
          smtpPort: s.smtpPort || null,
        },
        pdfBase64,
      }),
    });
    if (!icoreRes.ok) {
      result.icore = 'HTTP ' + icoreRes.status;
      console.error('iCore webhook returned', icoreRes.status);
    }
  } catch (e) {
    result.icore = e.message;
    console.error('iCore webhook failed:', e.message);
  }

  return result;
}

module.exports = { notifySignup };
