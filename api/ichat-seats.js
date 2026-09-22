const { createClient } = require('@supabase/supabase-js');

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

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ confirmed: count || 0 });
};
