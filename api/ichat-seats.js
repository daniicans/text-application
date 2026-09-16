const { createClient } = require('@supabase/supabase-js');

const SEAT_CAP = 20;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { count, error } = await supabase
    .from('ichat_beta_signups')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  if (error) {
    console.error('seat count failed:', error.message);
    return res.status(500).json({ error: 'Could not load seat count' });
  }

  const confirmed = Math.min(count || 0, SEAT_CAP);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    confirmed,
    cap: SEAT_CAP,
    remaining: SEAT_CAP - confirmed,
    open: confirmed < SEAT_CAP,
  });
};
