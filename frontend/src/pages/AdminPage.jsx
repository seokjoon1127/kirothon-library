import React, { useState, useEffect, useRef } from 'react';
import { getSeats, sendSnapshot } from '../api';
import SeatCard from '../components/SeatCard';

function AdminPage() {
  const [seats, setSeats] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [log, setLog] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // 10초마다 좌석 조회
  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, []);

const prevSeatsRef = useRef([]);

  async function fetchSeats() {
    try {
      const data = await getSeats();
      
      // 이전 상태와 비교해서 변화가 있으면 로그 추가
      if (prevSeatsRef.current.length > 0) {
        data.forEach(seat => {
          const prev = prevSeatsRef.current.find(s => s.seat_id === seat.seat_id);
          if (prev && prev.status !== seat.status) {
            addLog(`🔄 ${seat.seat_id}: ${prev.status} → ${seat.status}`);
          }
          if (prev && prev.absence_count !== seat.absence_count && seat.absence_count > 0) {
            addLog(`⏱️ ${seat.seat_id}: 부재 ${seat.absence_count}회`);
          }
        });
      }
      
      prevSeatsRef.current = data;
      setSeats(data);
    } catch (e) {
      console.error('좌석 조회 실패:', e);
    }
  }

  // 카메라 시작
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);

      // 30초마다 자동 스냅샷
      intervalRef.current = setInterval(captureAndAnalyze, 10000);
      // 시작하자마자 한 번 실행
      setTimeout(captureAndAnalyze, 2000);
    } catch (e) {
      alert('카메라 접근 실패: ' + e.message);
    }
  }

  // 카메라 중지
  function stopCamera() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCameraActive(false);
  }

  // 스냅샷 촬영 + AI 분석
  async function captureAndAnalyze() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);

    addLog('AI 분석 중...');

    try {
      const result = await sendSnapshot(imageBase64);
      setLastResult(result);
      fetchSeats();

      if (result.results) {
        result.results.forEach(r => {
          addLog(`좌석 ${r.seat_id}: 사람=${r.person ? '✅' : '❌'}, 짐=${r.stuff ? '✅' : '❌'}, ${r.previous_status}→${r.new_status} (${r.action})`);
        });
      }
    } catch (e) {
      addLog('❌ AI 분석 실패: ' + e.message);
    }
  }

  function addLog(msg) {
    const time = new Date().toLocaleTimeString('ko-KR');
    setLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🖥️ 관리자 대시보드</h1>

      {/* 좌석 카드들 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {seats.map(seat => (
          <SeatCard key={seat.seat_id} seat={seat} isAdmin={true} />
        ))}
      </div>

      {/* 카메라 섹션 */}
      <h2>📹 카메라 모니터링</h2>
      <div style={{ marginBottom: '20px' }}>
        {!cameraActive ? (
          <button onClick={startCamera}
            style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer',
                     backgroundColor: '#4caf50', color: 'white', border: 'none',
                     borderRadius: '6px' }}>
            카메라 시작
          </button>
        ) : (
          <button onClick={stopCamera}
            style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer',
                     backgroundColor: '#f44336', color: 'white', border: 'none',
                     borderRadius: '6px' }}>
            카메라 중지
          </button>
        )}
        <button onClick={captureAndAnalyze}
          disabled={!cameraActive}
          style={{ marginLeft: '10px', padding: '12px 24px', fontSize: '16px',
                   cursor: cameraActive ? 'pointer' : 'not-allowed',
                   backgroundColor: cameraActive ? '#2196f3' : '#ccc',
                   color: 'white', border: 'none', borderRadius: '6px' }}>
          수동 촬영
        </button>
      </div>

      <video ref={videoRef} autoPlay playsInline muted
        style={{ width: '100%', maxWidth: '600px', borderRadius: '8px',
                 display: cameraActive ? 'block' : 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 이벤트 로그 */}
      <h2>📋 이벤트 로그</h2>
      <div style={{
        maxHeight: '300px', overflowY: 'auto', backgroundColor: '#1e1e1e',
        color: '#00ff00', padding: '12px', borderRadius: '8px',
        fontFamily: 'monospace', fontSize: '13px'
      }}>
        {log.length === 0 ? (
          <p style={{ color: '#666' }}>카메라를 시작하면 로그가 표시됩니다.</p>
        ) : (
          log.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </div>
  );
}

export default AdminPage;