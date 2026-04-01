/**
 * 좌석 상태와 로그인 정보에 따라 버튼 타입을 결정한다.
 * @returns {'reserve' | 'cancel' | null}
 */
export function getButtonType(seat, studentId) {
  if (!studentId) return null;
  if (seat.status === 'AVAILABLE') return 'reserve';
  if (seat.student_id === studentId && seat.status !== 'AVAILABLE') return 'cancel';
  return null;
}

/**
 * 본인 좌석에 경고가 있는지 확인한다.
 */
export function shouldShowWarning(seats, studentId) {
  if (!studentId || !seats) return false;
  return seats.some(
    (s) => s.student_id === studentId && s.warning_count > 0
  );
}
