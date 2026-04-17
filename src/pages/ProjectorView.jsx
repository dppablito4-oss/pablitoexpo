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
      <NasaWebTemplate data={slidesData} />

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
function GuestPaywall({ guestViewsCount, onRegister }) {
  const isAggressive = guestViewsCount > 3;

  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center p-8 text-center overflow-hidden" 
      style={{
        minHeight: '60vh',
        background: 'linear-gradient(to bottom, rgba(10,10,15,0) 0%, rgba(10,10,15,0.9) 20%, #000 100%)',
        marginTop: '-20vh', // Solapa con la diapositiva anterior
        zIndex: 50
      }}
    >
      <div className="absolute inset-0 backdrop-blur-md" style={{ zIndex: -1 }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: '600px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{isAggressive ? '🚨' : '🚀'}</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {isAggressive ? '¡GAAA! ¡Ya viste muchas a la mala!' : 'Te quedaste a la mitad de la magia'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
          {isAggressive 
            ? 'El radar detecta que te encantan nuestros proyectos, pero los servidores no se pagan solos. Crea tu cuenta gratis para desbloquear el modo láser y ver las diapositivas secretas.' 
            : 'Solo los agentes registrados tienen acceso a la presentación completa. Entra ahora para descubrir el resto del contenido y activar el Modo Proyector con Láser.'}
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={onRegister}
            className="btn-cyber" 
            style={{ padding: '16px 32px', fontSize: '1.1rem', background: 'var(--accent-primary)', color: 'black', fontWeight: 'bold', boxShadow: '0 0 20px rgba(0,240,255,0.4)', borderRadius: '12px' }}
          >
            CREAR CUENTA GRATIS
          </button>
          <button 
            onClick={onRegister}
            className="btn-cyber" 
            style={{ padding: '16px 32px', fontSize: '1.1rem', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px' }}
          >
            YA TENGO ACCESO
          </button>
        </div>
      </motion.div>
    </div>
  );
}
