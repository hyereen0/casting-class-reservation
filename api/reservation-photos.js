const { createClient } = require('@supabase/supabase-js');

const bucket = 'reservation-photos';

function clients() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error('서버 환경 변수가 설정되지 않았습니다.');
  return { auth: createClient(url, anonKey), admin: createClient(url, serviceKey), url };
}

async function ensureBucket(admin) {
  const result = await admin.storage.getBucket(bucket);
  if (result.data) return;
  const created = await admin.storage.createBucket(bucket, { public: true });
  if (created.error && !created.error.message.toLowerCase().includes('already exists')) throw created.error;
}

module.exports = async function handler(req, res) {
  try {
    const { auth, admin, url } = clients();
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });
    const current = await auth.auth.getUser(token);
    if (current.error || !current.data.user) return res.status(401).json({ error: '로그인이 필요합니다.' });

    await ensureBucket(admin);
    const reservationId = String(req.query.reservationId || req.body?.reservationId || '');
    if (!reservationId) return res.status(400).json({ error: '예약 정보가 없습니다.' });

    if (req.method === 'GET') {
      const listed = await admin.storage.from(bucket).list(reservationId, { limit: 10 });
      if (listed.error) throw listed.error;
      const photos = {};
      for (const item of listed.data || []) {
        if (item.name !== 'in' && item.name !== 'out') continue;
        photos[item.name] = `${url}/storage/v1/object/public/${bucket}/${reservationId}/${item.name}`;
      }
      return res.status(200).json({ photos });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (current.data.user.user_metadata?.role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    const { type, data, contentType } = req.body || {};
    if (!['in', 'out'].includes(type) || typeof data !== 'string') return res.status(400).json({ error: '사진 정보가 올바르지 않습니다.' });
    const raw = data.replace(/^data:[^;]+;base64,/, '');
    const result = await admin.storage.from(bucket).upload(`${reservationId}/${type}`, Buffer.from(raw, 'base64'), { contentType: contentType || 'image/jpeg', upsert: true });
    if (result.error) throw result.error;
    return res.status(200).json({ url: `${url}/storage/v1/object/public/${bucket}/${reservationId}/${type}` });
  } catch (error) {
    return res.status(500).json({ error: error.message || '사진 저장에 실패했습니다.' });
  }
};
