import { authenticatedUser, createClients, json, methodNotAllowed, serverError } from '../_shared/supabase.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed();

  try {
    const { auth, admin } = createClients(env);
    const current = await authenticatedUser(request, auth);
    if (current.response) return current.response;
    if (current.user.user_metadata?.role !== 'admin') {
      return json({ error: '관리자 권한이 필요합니다.' }, 403);
    }

    const users = [];
    const perPage = 100;
    for (let page = 1; ; page += 1) {
      const result = await admin.auth.admin.listUsers({ page, perPage });
      if (result.error) return json({ error: result.error.message }, 500);
      users.push(...result.data.users);
      if (result.data.users.length < perPage) break;
    }

    return json({
      users: users.map(user => ({
        id: user.id,
        username: user.user_metadata?.username || '아이디 미설정',
        role: user.user_metadata?.role === 'admin' ? '관리자' : '일반 사용자',
        confirmed: Boolean(user.email_confirmed_at),
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    return serverError(error, '계정 목록을 불러오지 못했습니다.');
  }
}
