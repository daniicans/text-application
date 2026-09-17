const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { notifySignup } = require('./ichat-notify');

const SEAT_CAP = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
// Platforms that connect via an app password; custom-domain connects via DNS delegation instead.
const APP_PASSWORD_PLATFORMS = ['gmail', 'yahoo', 'outlook', 'icloud', 'other'];
const PLATFORMS = [...APP_PASSWORD_PLATFORMS, 'custom-domain'];
const DOMAIN_PROVIDERS = ['godaddy', 'namecheap', 'cloudflare', 'squarespace', 'wix', 'hostinger', 'other'];

function encryptAppPassword(plaintext, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('ICHAT_PW_ENC_KEY must be 32 bytes of hex (64 hex characters)');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ICHAT_PW_ENC_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ICHAT_PW_ENC_KEY) {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const b = req.body || {};
  const fullName = String(b.fullName || '').trim();
  const companyName = String(b.companyName || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const phone = String(b.phone || '').trim();
  const mainEmail = String(b.mainEmail || '').trim().toLowerCase();
  const emailPlatform = String(b.emailPlatform || '').trim().toLowerCase();
  const domain = String(b.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainProvider = String(b.domainProvider || '').trim();
  const delegationOk = b.delegationOk === true;
  const planConfirmed = b.planConfirmed === true;
  const appPassword = String(b.appPassword || '');

  if (!planConfirmed) {
    return res.status(400).json({ error: 'The iChat beta is only available to Plus plan subscribers' });
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return res.status(400).json({ error: 'Please enter your full name' });
  }
  if (companyName.length < 2 || companyName.length > 160) {
    return res.status(400).json({ error: 'Please enter your company name' });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid account email address' });
  }
  if (phone.length > 30) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }
  if (!EMAIL_RE.test(mainEmail) || mainEmail.length > 254) {
    return res.status(400).json({ error: 'Please enter the email address iChat should send and receive from' });
  }
  if (!PLATFORMS.includes(emailPlatform)) {
    return res.status(400).json({ error: 'Please select your email platform' });
  }

  const usesCustomDomain = emailPlatform === 'custom-domain';
  if (usesCustomDomain) {
    if (!DOMAIN_RE.test(domain) || domain.length > 253) {
      return res.status(400).json({ error: 'Please enter your custom domain (e.g. yourcompany.com)' });
    }
    if (!DOMAIN_PROVIDERS.includes(domainProvider.toLowerCase())) {
      return res.status(400).json({ error: 'Please select your domain carrier' });
    }
    if (!delegationOk) {
      return res.status(400).json({ error: 'Please delegate access to webdev@icans.ai at your domain carrier, then check the box' });
    }
  } else if (appPassword.length < 8 || appPassword.length > 256) {
    return res.status(400).json({ error: 'Please enter the app password for your email platform' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc('reserve_ichat_seat', {
    p_data: {
      full_name: fullName,
      company_name: companyName,
      email,
      phone,
      main_email: mainEmail,
      email_platform: emailPlatform,
      uses_custom_domain: usesCustomDomain,
      domain: usesCustomDomain ? domain : '',
      domain_provider: usesCustomDomain ? domainProvider : '',
      delegation_ok: usesCustomDomain ? delegationOk : false,
      plan_confirmed: planConfirmed,
    },
  });

  if (error) {
    if (error.message && error.message.includes('BETA_FULL')) {
      return res.status(409).json({ error: 'full', message: 'The iChat beta is full' });
    }
    if (error.message && error.message.includes('ALREADY_SIGNED_UP')) {
      return res.status(409).json({ error: 'duplicate', message: 'This email is already signed up' });
    }
    console.error('reserve_ichat_seat failed:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  const seat = Array.isArray(data) ? data[0] : data;
  if (!seat || !seat.signup_id) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  if (!usesCustomDomain) {
    try {
      const enc = encryptAppPassword(appPassword, ICHAT_PW_ENC_KEY);
      const { error: pwError } = await supabase
        .from('ichat_beta_app_passwords')
        .insert({ signup_id: seat.signup_id, ...enc });
      if (pwError) throw new Error(pwError.message);
    } catch (err) {
      // Free the seat so a failed password write doesn't burn one of the 20 slots.
      console.error('app password store failed:', err.message);
      await supabase.from('ichat_beta_signups').delete().eq('id', seat.signup_id);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }

  // Email + PDF to onboarding and push to iCore, same as the texting
  // application. Never fails the signup — the seat is already reserved.
  await notifySignup({
    seatNumber: seat.seat_number,
    fullName: name,
    companyName,
    email: mail,
    mainEmail,
    emailPlatform,
    usesCustomDomain,
    domain: usesCustomDomain ? domain : '',
    domainProvider: usesCustomDomain ? domainProvider : '',
    delegationOk: usesCustomDomain ? delegationOk : false,
    planConfirmed,
    appPassword: usesCustomDomain ? '' : pw,
  });

  return res.status(200).json({
    ok: true,
    seatNumber: seat.seat_number,
    seatsRemaining: seat.seats_remaining,
    cap: SEAT_CAP,
  });
};
