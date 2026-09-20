const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!url || !anonKey || !serviceKey || !token) return res.status(401).json({ error: '로그인이 필요합니다.' });
    const auth = createClient(url, anonKey);
    const current = await auth.auth.getUser(token);
    if (current.error || !current.data.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
    const { reservationId, status } = req.body || {};
    if (!reservationId || !['using', 'done', 'cancelled'].includes(status)) return res.status(400).json({ error: '상태 정보가 올바르지 않습니다.' });
    const admin = createClient(url, serviceKey);
    const reservation = await admin.from('reservations').select('user_id').eq('id', reservationId).maybeSingle();
    if (reservation.error) throw reservation.error;
    if (current.data.user.user_metadata?.role !== 'admin' && reservation.data?.user_id !== current.data.user.id) {
      return res.status(403).json({ error: '본인 예약만 변경할 수 있습니다.' });
    }
    const updated = await admin.from('reservations').update({ status }).eq('id', reservationId);
    if (updated.error) throw updated.error;
    return res.status(200).json({ status });
  } catch (error) {
    return res.status(500).json({ error: error.message || '예약 상태 저장에 실패했습니다.' });
  }
};
