const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  const { userId } = req.body || {};
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !userId || !url || !anonKey || !serviceKey) return res.status(500).json({ error: '서버 설정이 부족합니다.' });

  const auth = createClient(url, anonKey);
  const current = await auth.auth.getUser(token);
  if (current.error || current.data.user?.user_metadata?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  if (current.data.user.id === userId) return res.status(400).json({ error: '현재 로그인한 관리자 계정은 삭제할 수 없습니다.' });

  const admin = createClient(url, serviceKey);
  const target = await admin.auth.admin.getUserById(userId);
  if (target.error) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' });
  if (target.data.user.user_metadata?.role === 'admin') return res.status(400).json({ error: '관리자 계정은 삭제할 수 없습니다.' });

  const result = await admin.auth.admin.deleteUser(userId);
  if (result.error) return res.status(400).json({ error: result.error.message });
  return res.status(200).json({ ok: true });
};
