import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Importar UNICAMENTE la plantilla Magna
import NasaWebTemplate from '../templates/NasaWebTemplate';
import AiQuizWidget from '../components/AiQuizWidget';

export default function ProjectorView() {
  const { slug: identifier } = useParams();
  const navigate = useNavigate();
  
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestViewsCount, setGuestViewsCount] = useState(0);
  
  // Laser Nivel Dios (GPU directo)
  const laserX = useMotionValue(window.innerWidth / 2);
  const laserY = useMotionValue(window.innerHeight / 2);
  const smoothX = useSpring(laserX, { stiffness: 200, damping: 20, mass: 0.5 });
  const smoothY = useSpring(laserY, { stiffness: 200, damping: 20, mass: 0.5 });

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
          navigate(`/projector/${data.slug}`, { replace: true });
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

  // Handle local storage for guest view count
  useEffect(() => {
    if (loading) return; // wait until presentation is loaded
    if (!user && presentation) {
      const currentViews = parseInt(localStorage.getItem('guest_views') || '0', 10);
      const newCount = currentViews + 1;
      localStorage.setItem('guest_views', newCount.toString());
      setGuestViewsCount(newCount);
    }
  }, [loading, user, presentation]);

  // Handle real-time connection logic separated so it uses presentation.id
  useEffect(() => {
    if (!presentation?.id) return;
    
    // We MUST use presentation.id to subscribe, since the remote controller sends events to the UUID channel
    const channel = supabase.channel(`presentation-${presentation.id}`);
    channel
      .on('broadcast', { event: 'navigate' }, (payload) => {
        const amount = window.innerHeight * 0.8;
        if (payload.payload.direction === 'next') {
            window.scrollBy({ top: amount, behavior: 'smooth' });
        } else if (payload.payload.direction === 'prev') {
            window.scrollBy({ top: -amount, behavior: 'smooth' });
        }
      })
      .on('broadcast', { event: 'laser' }, (payload) => {
        laserX.set(payload.payload.x * window.innerWidth);
        laserY.set(payload.payload.y * window.innerHeight);
      })
      .on('broadcast', { event: 'remote-scroll' }, (payload) => {
        window.scrollBy({ top: payload.payload.deltaY, behavior: 'auto' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [presentation?.id, laserX, laserY]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Sincronizando Proyector...</div>;
  if (!presentation) return null;

  const slidesData = presentation.slides_data || {};
  // Support both new sections[] format and old nasa{} format
  let rawSections = slidesData.sections || [];
  const isGuestMode = !user && rawSections.length > 2;
  const sections = isGuestMode ? rawSections.slice(0, 2) : rawSections;
  
  const nasaData = slidesData.nasa || (sections[0]?.elements ? {} : slidesData);

  return (
    <div className="w-full bg-black relative cursor-none scroll-smooth">
      
      {/* 
        EL PROYECTOR AHORA ES UNA PÁGINA WEB REAL,
        SIN BARRERAS DE ALTURA NI OVERFLOW HIDDEN.
      */}
      {/* NasaWebTemplate recibe SOLO las secciones permitidas (recortadas para invitados) */}
      <NasaWebTemplate data={{ ...slidesData, sections }} />

      {/* Widget IA Quiz — pasa contexto de todas las secciones */}
      <AiQuizWidget nasaData={{ sections, ...nasaData }} />

      {/* Laser Virtual (Fixed a la ventana) */}
      <motion.div 
        style={{
          left: smoothX,
          top: smoothY,
          position: 'fixed', // Cambiado de absoluto a fixed para que flote sobre el scroll
          width: '20px',
          height: '20px',
          background: '#ff0055',
          borderRadius: '50%',
          boxShadow: '0 0 25px 10px rgba(255,0,85,0.6)',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        }}
      />
      
      {/* UI Flotante Decorativa */}
      <div className="fixed bottom-4 left-4 text-xs font-mono text-neutral-600 tracking-widest z-50 mix-blend-difference pointer-events-none">
        UPLINK: ACTIVO | PABLITO EXPO MEGA-WEB
      </div>

      {/* Guest Paywall */}
      {isGuestMode && (
        <GuestPaywall guestViewsCount={guestViewsCount} onRegister={() => navigate('/login')} />
      )}
    </div>
  );
}

// ── Paywall Component ──────────────────────────────────────────────────────────
function GuestPaywall({ onRegister }) {
  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center p-8 text-center overflow-hidden" 
      style={{
        minHeight: '70vh',
        background: 'linear-gradient(to bottom, rgba(10,10,15,0) 0%, rgba(10,10,15,0.95) 18%, #000 100%)',
        marginTop: '-22vh',
        zIndex: 50
      }}
    >
      <div className="absolute inset-0 backdrop-blur-sm" style={{ zIndex: -1 }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 60 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ 
          maxWidth: '640px', 
          background: 'rgba(0,240,255,0.03)', 
          border: '1px solid rgba(0,240,255,0.15)', 
          borderRadius: '28px', 
          padding: '48px 40px', 
          boxShadow: '0 0 60px rgba(0,240,255,0.08), 0 30px 60px rgba(0,0,0,0.7)' 
        }}
      >
        {/* Logo / Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(0,240,255,0.08)',
            border: '2px solid rgba(0,240,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,240,255,0.25)',
            padding: '14px'
          }}>
            <img 
              src="/favicon.svg" 
              alt="Pablito Expo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Lock Icon overlay badge */}
        <div style={{ fontSize: '1.5rem', marginBottom: '16px', letterSpacing: '0.1em', color: 'var(--accent-primary)', fontWeight: 'bold', fontFamily: 'monospace' }}>
          🔒 CONTENIDO PROTEGIDO
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '20px', lineHeight: '1.2' }}>
          Has llegado al límite del acceso como invitado
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', marginBottom: '36px', lineHeight: '1.75' }}>
          Únete a nuestra página para desbloquear el contenido restante y crear las tuyas, así como también activar el modo <strong style={{ color: 'var(--accent-primary)' }}>PRESENTACIÓN</strong> y tomar el control de un <strong style={{ color: 'var(--accent-primary)' }}>puntero láser desde tu teléfono</strong> para realizar una exposición nivel corporativo y guardar tus propios proyectos.
        </p>
        
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={onRegister}
            className="btn-cyber" 
            style={{ 
              padding: '16px 36px', fontSize: '1.05rem', 
              background: 'var(--accent-primary)', color: '#000', 
              fontWeight: '800', letterSpacing: '0.05em',
              boxShadow: '0 0 25px rgba(0,240,255,0.5)', 
              borderRadius: '14px', border: 'none'
            }}
          >
            UNIRSE GRATIS
          </button>
          <button 
            onClick={onRegister}
            style={{ 
              padding: '16px 36px', fontSize: '1.05rem', 
              background: 'transparent', color: 'rgba(255,255,255,0.7)', 
              fontWeight: '600',
              border: '1px solid rgba(255,255,255,0.15)', 
              borderRadius: '14px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            YA TENGO ACCESO
          </button>
        </div>
      </motion.div>
    </div>
  );
}
