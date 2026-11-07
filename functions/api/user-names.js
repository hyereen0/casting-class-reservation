import { authenticatedUser, createClients, json, methodNotAllowed, serverError } from '../_shared/supabase.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed();

  try {
    const { auth, admin } = createClients(env);
    const current = await authenticatedUser(request, auth);
    if (current.response) return current.response;

    const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (result.error) throw result.error;
    const names = Object.fromEntries(result.data.users.map(user => [
      user.id,
      user.user_metadata?.username || user.email || user.id
    ]));
    return json({ names });
  } catch (error) {
    return serverError(error, '사용자 정보를 불러오지 못했습니다.');
  }
}
