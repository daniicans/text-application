const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, pdfBase64, irsLetterBase64, irsLetterMime } = req.body || {};

  if (!data) {
    return res.status(400).json({ error: 'Missing form data' });
  }

  const {
    businessName = '', firstName = '', lastName = '',
    website = '', ein = '', irsLetter = '',
    phone = '', accountEmail = '',
    areaCode = '', address = '', city = '', state = '', country = '', postal = '',
    plan = '',
  } = data;

  const planLabel = plan === 'growth'
    ? 'Growth — $159/month · 1,000 Messages'
    : plan === 'plus'
      ? 'Plus — $199/month · 2,000 Messages'
      : plan || '—';

  const subject = `New Text Application - ${businessName} & ${firstName} ${lastName}`.trim();

  const html = `
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
  .label { width: 160px; flex-shrink: 0; font-size: 12px; font-weight: 600; color: #6E6A93; padding-top: 1px; }
  .value { font-size: 13px; color: #1A1830; font-weight: 500; flex: 1; }
  .value.empty { color: #B5B2C9; font-style: italic; font-weight: 400; }
  .plan-badge { display: inline-block; background: #ECFAEE; color: #2E9039; border: 1px solid #D6F3DA; padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; }
  .footer { background: #F4F3F8; padding: 16px 36px; font-size: 11px; color: #6E6A93; border-top: 1px solid #E8E7EE; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>New Texting Application</h1>
    <p>Submitted ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>
  <div class="body">
    <div class="section">
      <p class="section-title">Business Information</p>
      <div class="row"><span class="label">Business Name</span><span class="value">${businessName || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">Website</span><span class="value">${website || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">EIN Number</span><span class="value">${ein || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">IRS Letter</span><span class="value">${irsLetter || '<span class="empty">Not uploaded</span>'}</span></div>
    </div>

    <div class="section">
      <p class="section-title">Contact Information</p>
      <div class="row"><span class="label">Name</span><span class="value">${firstName} ${lastName}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${phone || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">Account Email</span><span class="value">${accountEmail || '<span class="empty">Not provided</span>'}</span></div>
    </div>

    <div class="section">
      <p class="section-title">Business Address</p>
      <div class="row"><span class="label">Desired Area Code</span><span class="value">${areaCode || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${address || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">City</span><span class="value">${city || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">State</span><span class="value">${state || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">Country</span><span class="value">${country || '<span class="empty">Not provided</span>'}</span></div>
      <div class="row"><span class="label">Postal Code</span><span class="value">${postal || '<span class="empty">Not provided</span>'}</span></div>
    </div>

    <div class="section">
      <p class="section-title">Text Subscription</p>
      <div class="row"><span class="label">Selected Plan</span><span class="value"><span class="plan-badge">${planLabel}</span></span></div>
    </div>
  </div>
  <div class="footer">
    icans.ai &nbsp;·&nbsp; Texting Application &nbsp;·&nbsp; Confidential — for icans staff only
    ${pdfBase64 ? '<br>PDF application attached.' : ''}
  </div>
</div>
</body>
</html>`;

  // Plain-text fallback
  const text = [
    `New Text Application — ${businessName} · ${firstName} ${lastName}`,
    `Submitted: ${new Date().toLocaleString()}`,
    '',
    '── Business ──────────────────',
    `Business Name:  ${businessName}`,
    `Website:        ${website}`,
    `EIN Number:     ${ein}`,
    `IRS Letter:     ${irsLetter || 'Not uploaded'}`,
    '',
    '── Contact ───────────────────',
    `Name:           ${firstName} ${lastName}`,
    `Phone:          ${phone}`,
    `Account Email:  ${accountEmail}`,
    '',
    '── Address ───────────────────',
    `Area Code:      ${areaCode}`,
    `Address:        ${address}`,
    `City:           ${city}`,
    `State:          ${state}`,
    `Country:        ${country}`,
    `Postal Code:    ${postal}`,
    '',
    '── Subscription ──────────────',
    `Plan:           ${planLabel}`,
  ].join('\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const attachments = [];
  if (pdfBase64) {
    const safeName = businessName.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 60);
    attachments.push({
      filename: `TextApplication-${safeName}.pdf`,
      content: Buffer.from(pdfBase64, 'base64'),
      contentType: 'application/pdf',
    });
  }
  if (irsLetterBase64 && irsLetter) {
    attachments.push({
      filename: irsLetter,
      content: Buffer.from(irsLetterBase64, 'base64'),
      contentType: irsLetterMime || 'application/octet-stream',
    });
  }

  await transporter.sendMail({
    from: `"icans Applications" <${process.env.GMAIL_USER}>`,
    replyTo: accountEmail || undefined,
    to: process.env.TO_EMAIL || 'onboarding@icans.ai',
    subject,
    html,
    text,
    attachments,
  });

  return res.status(200).json({ success: true });
};
