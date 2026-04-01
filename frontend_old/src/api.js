import { API_BASE_URL } from './constants';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

/** 전체 좌석 조회 */
export function getSeats() {
  return request('/seats');
}

/** 좌석 예약 */
export function reserveSeat(seatId, studentId, studentName) {
  return request(`/seats/${seatId}/reserve`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, student_name: studentName }),
  });
}

/** 좌석 취소 */
export function cancelSeat(seatId, studentId) {
  return request(`/seats/${seatId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
}

/** 스냅샷 전송 */
export function postSnapshot(imageBase64) {
  return request('/snapshot', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}

/** 이벤트 로그 조회 */
export function getEvents(limit = 20) {
  return request(`/events?limit=${limit}`);
}
