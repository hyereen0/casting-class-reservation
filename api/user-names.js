const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!url || !anonKey || !serviceKey || !token) return res.status(401).json({ error: '로그인이 필요합니다.' });
    const auth = createClient(url, anonKey);
    const current = await auth.auth.getUser(token);
    if (current.error || !current.data.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
    const admin = createClient(url, serviceKey);
    const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (result.error) throw result.error;
    const names = Object.fromEntries(result.data.users.map(user => [user.id, user.user_metadata?.username || user.email || user.id]));
    return res.status(200).json({ names });
  } catch (error) {
    return res.status(500).json({ error: error.message || '사용자 정보를 불러오지 못했습니다.' });
  }
};
