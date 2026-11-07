import { authenticatedUser, createClients, json, methodNotAllowed, serverError } from '../_shared/supabase.js';

function usernameEmail(username) {
  const bytes = new TextEncoder().encode(username.trim());
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return `id_${btoa(binary).replace(/[^a-zA-Z0-9]/g, '')}@castingclass.local`;
}

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

    const { username, password } = body || {};
    if (typeof username !== 'string' || username.trim().length < 2 || typeof password !== 'string' || password.length < 6) {
      return json({ error: '아이디는 2자 이상, 비밀번호는 6자 이상 입력하세요.' }, 400);
    }

    const result = await admin.auth.admin.createUser({
      email: usernameEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username: username.trim(), role: 'user' }
    });
    if (result.error) return json({ error: result.error.message }, 400);
    return json({ username: username.trim() }, 201);
  } catch (error) {
    return serverError(error, '학생 계정을 만들지 못했습니다.');
  }
}
