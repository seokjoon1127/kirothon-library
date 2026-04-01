import { useState, useEffect, useRef, useCallback } from 'react';
import { getSeats, getEvents, postSnapshot } from '../api';
import { POLLING_INTERVAL, SNAPSHOT_INTERVAL, getStatusColor } from '../constants';

export default function AdminPage() {
  const [seats, setSeats] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const snapshotTimerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [seatsData, eventsData] = await Promise.all([getSeats(), getEvents()]);
      setSeats(seatsData);
      setEvents(eventsData);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const captureAndSend = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    try {
      const result = await postSnapshot(base64);
      setLastResult(result);
      await fetchData();
    } catch (e) {
      setError(e.message);
    }
  }, [fetchData]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      snapshotTimerRef.current = setInterval(captureAndSend, SNAPSHOT_INTERVAL);
    } catch (e) {
      setCameraError('카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
    }
  };

  const stopCamera = () => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setLastResult(null);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h2>관리자 대시보드</h2>

      {error && (
        <div role="alert" style={{ color: '#f44336', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* 좌석 대시보드 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {seats.map((seat) => (
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
                예약자: {seat.student_name} ({seat.student_id})
              </p>
            )}
            <p style={{ margin: '4px 0' }}>경고: {seat.warning_count}회</p>
          </div>
        ))}
      </div>

      {/* 카메라 영역 */}
      <div style={{ marginBottom: 24 }}>
        <h3>카메라 모니터링</h3>
        {cameraError && (
          <div role="alert" style={{ color: '#f44336', marginBottom: 8 }}>
            {cameraError}
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          {!cameraActive ? (
            <button onClick={startCamera} style={{ padding: '8px 20px', cursor: 'pointer' }}>
              카메라 시작
            </button>
          ) : (
            <button onClick={stopCamera} style={{ padding: '8px 20px', cursor: 'pointer' }}>
              카메라 중지
            </button>
          )}
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: 640,
            background: '#000',
            borderRadius: 8,
            display: cameraActive ? 'block' : 'none',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* 최근 분석 결과 */}
      {lastResult && (
        <div style={{ marginBottom: 24 }}>
          <h3>최근 분석 결과</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(lastResult).map(([seatId, r]) => (
              <div
                key={seatId}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: 160,
                  background: r.error ? '#ffebee' : '#e8f5e9',
                }}
              >
                <strong>{seatId}</strong>
                {r.error ? (
                  <p style={{ color: '#f44336', margin: '4px 0' }}>{r.error}</p>
                ) : (
                  <>
                    <p style={{ margin: '4px 0' }}>사람: {r.person_detected ? '감지' : '미감지'}</p>
                    <p style={{ margin: '4px 0' }}>짐: {r.stuff_detected ? '있음' : '없음'}</p>
                    <p style={{ margin: '4px 0' }}>→ {r.action}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이벤트 로그 */}
      <div>
        <h3>이벤트 로그</h3>
        {events.length === 0 ? (
          <p style={{ color: '#999' }}>이벤트가 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>시간</th>
                <th style={{ padding: 8 }}>좌석</th>
                <th style={{ padding: 8 }}>이벤트</th>
                <th style={{ padding: 8 }}>상세</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, fontSize: 13 }}>{ev.updated_at}</td>
                  <td style={{ padding: 8 }}>{ev.seat_id}</td>
                  <td style={{ padding: 8 }}>{ev.event_type}</td>
                  <td style={{ padding: 8, fontSize: 13 }}>{ev.event_detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
