const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !anonKey || !serviceKey) return res.status(500).json({ error: '서버 설정이 부족합니다.' });
  const auth = createClient(url, anonKey);
  const current = await auth.auth.getUser(token);
  if (current.error || current.data.user?.user_metadata?.role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  const admin = createClient(url, serviceKey);
  const users = [];
  const perPage = 100;
  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage });
    if (result.error) return res.status(500).json({ error: result.error.message });
    users.push(...result.data.users);
    if (result.data.users.length < perPage) break;
  }
  return res.status(200).json({ users: users.map(user => ({
    id: user.id,
    username: user.user_metadata?.username || '아이디 미설정',
    role: user.user_metadata?.role === 'admin' ? '관리자' : '일반 사용자',
    confirmed: Boolean(user.email_confirmed_at),
    createdAt: user.created_at
  })) });
};
