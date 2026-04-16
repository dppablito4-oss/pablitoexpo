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

  const handleTouchMove = (e) => {
    // Si podemos, detenemos el comportamiento default para evitar recargas
    if (e.cancelable) {
      e.preventDefault();
    }

    // Throttle básico para no saturar Supabase con 60fps
    const now = Date.now();
    if (now - lastEventRef.current < 40) return;
    lastEventRef.current = now;

    // Calculamos X y Y normalizados (0.0 a 1.0)
    const touch = e.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'laser', payload: { x, y } });
    }
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
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed rgba(0,240,255,0.4)',
          marginBottom: '20px',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <p style={{ color: 'var(--text-secondary)', pointerEvents: 'none', userSelect: 'none', textAlign: 'center' }}>
          Desliza tu dedo por aquí<br />para mover el láser en la PC
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
