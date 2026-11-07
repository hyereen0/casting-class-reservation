import { createClient } from '@supabase/supabase-js';

const authOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function methodNotAllowed() {
  return json({ error: 'Method not allowed' }, 405);
}

export function createClients(env) {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = env;
  if (!url || !anonKey || !serviceKey) throw new Error('서버 환경 변수가 설정되지 않았습니다.');

  return {
    auth: createClient(url, anonKey, authOptions),
    admin: createClient(url, serviceKey, authOptions)
  };
}

export async function authenticatedUser(request, auth) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { response: json({ error: '로그인이 필요합니다.' }, 401) };

  const result = await auth.auth.getUser(token);
  if (result.error || !result.data.user) {
    return { response: json({ error: '로그인이 필요합니다.' }, 401) };
  }

  return { user: result.data.user };
}

export function serverError(error, fallback) {
  console.error(fallback, error);
  return json({ error: error instanceof Error ? error.message : fallback }, 500);
}
