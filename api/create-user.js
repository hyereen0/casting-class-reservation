const { createClient } = require('@supabase/supabase-js');

function usernameEmail(username) {
  return `id_${Buffer.from(username.trim(), 'utf8').toString('base64').replace(/[^a-zA-Z0-9]/g, '')}@castingclass.local`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: '서버 환경 변수가 설정되지 않았습니다.' });

  const authClient = createClient(supabaseUrl, anonKey);
  const userResult = await authClient.auth.getUser(token);
  if (userResult.error || userResult.data.user?.user_metadata?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }

  const { username, password } = req.body || {};
  if (!username || username.trim().length < 2 || !password || password.length < 6) {
    return res.status(400).json({ error: '아이디는 2자 이상, 비밀번호는 6자 이상 입력하세요.' });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const result = await adminClient.auth.admin.createUser({
    email: usernameEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username: username.trim(), role: 'user' }
  });
  if (result.error) return res.status(400).json({ error: result.error.message });
  return res.status(201).json({ username: username.trim() });
};
