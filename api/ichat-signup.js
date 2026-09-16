const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const { fullName = '', email = '', phone = '', appPassword = '' } = req.body || {};

  const name = String(fullName).trim();
  const mail = String(email).trim().toLowerCase();
  const tel = String(phone).trim();
  const pw = String(appPassword);

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Please enter your full name' });
  }
  if (!EMAIL_RE.test(mail) || mail.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (pw.length < 8 || pw.length > 256) {
    return res.status(400).json({ error: 'Please enter your app-specific password' });
  }
  if (tel.length > 30) {
    return res.status(400).json({ error: 'Please enter a valid phone number' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc('reserve_ichat_seat', {
    p_full_name: name,
    p_email: mail,
    p_phone: tel || null,
  });

  if (error) {
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

  try {
    const enc = encryptAppPassword(pw, ICHAT_PW_ENC_KEY);
    const { error: pwError } = await supabase
      .from('ichat_beta_app_passwords')
      .insert({ signup_id: seat.signup_id, ...enc });
    if (pwError) throw new Error(pwError.message);
  } catch (err) {
    // Roll back the signup so a failed password write doesn't leave a half-registered row.
    console.error('app password store failed:', err.message);
    await supabase.from('ichat_beta_signups').delete().eq('id', seat.signup_id);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  return res.status(200).json({
    ok: true,
    seatNumber: seat.seat_number,
  });
};
