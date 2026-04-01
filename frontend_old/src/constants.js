/** API 기본 URL (환경변수) */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** 좌석 현황 폴링 간격 (ms) */
export const POLLING_INTERVAL = 5000;

/** 스냅샷 촬영 간격 (ms) */
export const SNAPSHOT_INTERVAL = Number(import.meta.env.VITE_SNAPSHOT_INTERVAL) || 5000;

/**
 * 좌석 상태에 따른 색상을 반환한다.
 * AVAILABLE(초록), RESERVED(노랑), OCCUPIED(파랑),
 * ABSENT_WITH_STUFF/ABSENT_EMPTY/WARNING_SENT(주황), AUTO_RETURNED(빨강)
 */
export function getStatusColor(status) {
  switch (status) {
    case 'AVAILABLE':
      return '#4caf50';
    case 'RESERVED':
      return '#ffeb3b';
    case 'OCCUPIED':
      return '#2196f3';
    case 'ABSENT_WITH_STUFF':
    case 'ABSENT_EMPTY':
    case 'WARNING_SENT':
      return '#ff9800';
    case 'AUTO_RETURNED':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}
