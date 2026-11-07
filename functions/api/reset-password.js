import { authenticatedUser, createClients, json, methodNotAllowed, serverError } from '../_shared/supabase.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return methodNotAllowed();

  try {
    const { auth, admin } = createClients(env);
    const current = await authenticatedUser(request, auth);
    if (current.response) return current.response;
    if (current.user.user_metadata?.role !== 'admin') {
      return json({ error: '관리자 권한이 필요합니다.' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: '요청 정보가 올바르지 않습니다.' }, 400);
    }
    const { userId } = body || {};
    if (!userId) return json({ error: '계정 정보가 없습니다.' }, 400);

    const result = await admin.auth.admin.updateUserById(userId, { password: '12345678' });
    if (result.error) return json({ error: result.error.message }, 400);
    return json({ ok: true });
  } catch (error) {
    return serverError(error, '비밀번호를 초기화하지 못했습니다.');
  }
}
