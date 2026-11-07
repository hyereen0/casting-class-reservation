import { authenticatedUser, createClients, json, methodNotAllowed, serverError } from '../_shared/supabase.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return methodNotAllowed();

  try {
    const { auth, admin } = createClients(env);
    const current = await authenticatedUser(request, auth);
    if (current.response) return current.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: '요청 정보가 올바르지 않습니다.' }, 400);
    }
    const { reservationId, status } = body || {};
    if (!reservationId || !['using', 'done', 'cancelled'].includes(status)) {
      return json({ error: '상태 정보가 올바르지 않습니다.' }, 400);
    }

    const reservation = await admin.from('reservations').select('user_id').eq('id', reservationId).maybeSingle();
    if (reservation.error) throw reservation.error;
    if (current.user.user_metadata?.role !== 'admin' && reservation.data?.user_id !== current.user.id) {
      return json({ error: '본인 예약만 변경할 수 있습니다.' }, 403);
    }

    const updated = await admin.from('reservations').update({ status }).eq('id', reservationId);
    if (updated.error) throw updated.error;
    return json({ status });
  } catch (error) {
    return serverError(error, '예약 상태 저장에 실패했습니다.');
  }
}
