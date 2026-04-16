import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function RemoteControl() {
  const { id } = useParams();
  const navigate = useNavigate();
  const channelRef = useRef(null);
  const lastEventRef = useRef(0);

  useEffect(() => {
    // Nos suscribimos al ID de esta presentación exacta
    const channel = supabase.channel(`presentation-${id}`);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  const sendNav = (direction) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'nav', payload: { direction } });
    }
  };

  const lastPinchYRef = useRef(null);

  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();

    const now = Date.now();
    if (now - lastEventRef.current < 30) return;
    lastEventRef.current = now;

    // SCROLL con 2 dedos
    if (e.touches.length === 2) {
      const avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      if (lastPinchYRef.current !== null) {
        const deltaY = lastPinchYRef.current - avgY;
        // Broadcast de scroll suave (multiplicado para más sensibilidad)
        if (channelRef.current) {
          channelRef.current.send({ type: 'broadcast', event: 'remote-scroll', payload: { deltaY: deltaY * 2.5 } });
        }
      }
      lastPinchYRef.current = avgY;
      return;
    }

    // LASER con 1 dedo
    if (e.touches.length === 1) {
      lastPinchYRef.current = null; // reset pinch
      const touch = e.touches[0];
      const x = touch.clientX / window.innerWidth;
      const y = touch.clientY / window.innerHeight;

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'laser', payload: { x, y } });
      }
    }
  };

  const handleTouchEnd = () => {
      lastPinchYRef.current = null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--accent-primary)' }}>Láser Remoto 📱</h2>
        <button onClick={() => navigate('/')} style={{ background: 'none', color: 'var(--text-secondary)', border: 'none' }}>Cerrar</button>
      </header>

      {/* Trackpad para el láser */}
      <div
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed rgba(0,240,255,0.4)',
          marginBottom: '20px',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <p style={{ color: 'var(--text-secondary)', pointerEvents: 'none', userSelect: 'none', textAlign: 'center', marginBottom: '10px' }}>
          ✨ 1 dedo: Mueve el láser<br/>
          ⏬ 2 dedos: SCROLL LIBRE
        </p>
      </div>

      {/* Botones de navegación */}
      <div style={{ display: 'flex', gap: '15px', height: '90px' }}>
        <button onClick={() => sendNav('prev')} className="btn-cyber" style={{ flex: 1, fontSize: '1.2rem', border: '1px solid var(--border-color)' }}>
          ⬅️ Atrás
        </button>
        <button onClick={() => sendNav('next')} className="btn-cyber" style={{ flex: 2, fontSize: '1.2rem', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
          Siguiente ➡️
        </button>
      </div>
    </div>
  );
}
