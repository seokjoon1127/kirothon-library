import { useState, useEffect, useCallback } from 'react';
import { getSeats, reserveSeat, cancelSeat } from '../api';
import { POLLING_INTERVAL, getStatusColor } from '../constants';
import { getButtonType, shouldShowWarning } from '../utils';

export default function StudentPage() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [seats, setSeats] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSeats = useCallback(async () => {
    try {
      const data = await getSeats();
      setSeats(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    fetchSeats();
    const id = setInterval(fetchSeats, POLLING_INTERVAL);
    return () => clearInterval(id);
  }, [loggedIn, fetchSeats]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (studentId.trim() && studentName.trim()) {
      setLoggedIn(true);
    }
  };

  const handleReserve = async (seatId) => {
    setLoading(true);
    try {
      await reserveSeat(seatId, studentId, studentName);
      await fetchSeats();
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (seatId) => {
    setLoading(true);
    try {
      await cancelSeat(seatId, studentId);
      await fetchSeats();
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h2>도서관 좌석 예약</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="studentId">학번</label>
            <input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="학번 입력"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="studentName">이름</label>
            <input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="이름 입력"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
              required
            />
          </div>
          <button type="submit" style={{ padding: '8px 24px', cursor: 'pointer' }}>
            로그인
          </button>
        </form>
      </div>
    );
  }

  const showWarning = shouldShowWarning(seats, studentId);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {showWarning && (
        <div
          role="alert"
          style={{
            background: '#f44336',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontWeight: 'bold',
          }}
        >
          ⚠️ 장시간 이탈이 감지되었습니다. 좌석으로 복귀해주세요.
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: '#f44336', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <h2>좌석 현황</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        {studentName}({studentId}) 님 환영합니다.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {seats.map((seat) => {
          const btnType = getButtonType(seat, studentId);
          return (
            <div
              key={seat.seat_id}
              style={{
                border: '2px solid #ddd',
                borderRadius: 12,
                padding: 20,
                width: 200,
                background: getStatusColor(seat.status),
                color: seat.status === 'RESERVED' ? '#333' : '#fff',
              }}
            >
              <h3 style={{ margin: '0 0 8px' }}>좌석 {seat.seat_id}</h3>
              <p style={{ margin: '4px 0' }}>상태: {seat.status}</p>
              {seat.student_name && (
                <p style={{ margin: '4px 0' }}>
                  예약자: {seat.student_name}
                </p>
              )}
              {seat.warning_count > 0 && (
                <p style={{ margin: '4px 0' }}>경고: {seat.warning_count}회</p>
              )}

              {btnType === 'reserve' && (
                <button
                  onClick={() => handleReserve(seat.seat_id)}
                  disabled={loading}
                  style={{ marginTop: 8, padding: '6px 16px', cursor: 'pointer' }}
                >
                  예약
                </button>
              )}
              {btnType === 'cancel' && (
                <button
                  onClick={() => handleCancel(seat.seat_id)}
                  disabled={loading}
                  style={{ marginTop: 8, padding: '6px 16px', cursor: 'pointer' }}
                >
                  취소
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
