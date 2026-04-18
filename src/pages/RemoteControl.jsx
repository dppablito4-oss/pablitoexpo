import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export default function RemoteControl() {
  const { slug: identifier } = useParams();
  const navigate = useNavigate();
  const channelRef = useRef(null);
  const lastEventRef = useRef(0);
  const lastScrollYRef = useRef(null);
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState('laser'); // 'laser' o 'scroll'

  useEffect(() => {
    const loadPresentation = async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let data, error;

      if (isUUID) {
        // Fallback for old links: Fetch by ID
        const res = await supabase.from('presentations').select('*').eq('id', identifier).single();
        data = res.data; error = res.error;
        
        // Smart Redirect to the new slug URL
        if (!error && data && data.slug) {
          navigate(`/remote/${data.slug}`, { replace: true });
          return;
        }
      } else {
        // Fetch by Slug
        const res = await supabase.from('presentations').select('*').eq('slug', identifier).single();
        data = res.data; error = res.error;
      }

      if (error || !data) {
        alert("Transmisión perdida o presentación no encontrada.");
        navigate('/');
        return;
      }
      setPresentation(data);
      setLoading(false);
    };

    loadPresentation();
  }, [identifier, navigate]);

  useEffect(() => {
    if (!presentation?.id) return;

    const channel = supabase.channel(`presentation-${presentation.id}`);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [presentation?.id]);

  const sendNav = (direction) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'navigate', payload: { direction } });
    }
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();

    const now = Date.now();
    if (now - lastEventRef.current < 25) return; // 40fps max para no saturar
    lastEventRef.current = now;

    if (e.touches.length !== 1) return; // Forzar a que solo se use 1 dedo SIEMPRE
    const touch = e.touches[0];

    if (mode === 'scroll') {
      if (lastScrollYRef.current !== null) {
        // En móviles, mover el dedo ARRIBA (scrollY negativo) es hacer scroll ABAJO en la pantalla
        const deltaY = lastScrollYRef.current - touch.clientY; 
        if (channelRef.current) {
          channelRef.current.send({ type: 'broadcast', event: 'remote-scroll', payload: { deltaY: deltaY * 2.0 } });
        }
      }
      lastScrollYRef.current = touch.clientY;
    } else {
      // Modo Laser
      const x = touch.clientX / window.innerWidth;
      const y = touch.clientY / window.innerHeight;

      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'laser', payload: { x, y } });
      }
    }
  };

  const handleTouchEnd = () => {
      lastScrollYRef.current = null;
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems:'center', justifyContent:'center', color: 'white' }}>Enlazando Remoto...</div>;
  if (!presentation) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--accent-primary)', margin: 0, fontSize: '1.2rem' }}>Uplink Remoto</h2>
        <button onClick={() => navigate('/')} style={{ background: 'none', color: 'var(--text-secondary)', border: 'none' }}>Desconectar</button>
      </header>

      {/* TOGGLE MODO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
              onClick={() => setMode('laser')}
              style={{
                  flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '10px',
                  backgroundColor: mode === 'laser' ? '#ff0055' : '#333',
                  color: mode === 'laser' ? 'white' : '#888',
                  transition: 'background 0.3s'
              }}
          >
              🔴 MODO LÁSER
          </button>
          <button 
              onClick={() => setMode('scroll')}
              style={{
                  flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '10px',
                  backgroundColor: mode === 'scroll' ? '#00f0ff' : '#333',
                  color: mode === 'scroll' ? 'black' : '#888',
                  transition: 'background 0.3s'
              }}
          >
              ↕️ MODO NAVEGAR
          </button>
      </div>

      {/* Trackpad Principal */}
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
          border: mode === 'scroll' ? '2px dashed #00f0ff' : '2px dashed rgba(255,0,85,0.6)',
          marginBottom: '20px',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <p style={{ color: 'var(--text-secondary)', pointerEvents: 'none', userSelect: 'none', textAlign: 'center', fontSize: '1.1rem' }}>
          {mode === 'laser' ? '👆 Desliza 1 dedo para mover LÁSER' : '👆 Desliza 1 dedo para hacer SCROLL'}
        </p>
      </div>

      {/* Botones de navegación de salto */}
      <div style={{ display: 'flex', gap: '15px', height: '80px' }}>
        <button onClick={() => sendNav('prev')} className="btn-cyber" style={{ flex: 1, fontSize: '1rem', border: '1px solid var(--border-color)' }}>
          Bloque ⬆️
        </button>
        <button onClick={() => sendNav('next')} className="btn-cyber" style={{ flex: 1, fontSize: '1rem', border: '1px solid var(--border-color)' }}>
          Bloque ⬇️
        </button>
      </div>
    </div>
  );
}
