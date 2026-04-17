import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Importar UNICAMENTE la plantilla Magna
import NasaWebTemplate from '../templates/NasaWebTemplate';
import AiQuizWidget from '../components/AiQuizWidget';

export default function ProjectorView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Laser Nivel Dios (GPU directo)
  const laserX = useMotionValue(window.innerWidth / 2);
  const laserY = useMotionValue(window.innerHeight / 2);
  const smoothX = useSpring(laserX, { stiffness: 200, damping: 20, mass: 0.5 });
  const smoothY = useSpring(laserY, { stiffness: 200, damping: 20, mass: 0.5 });

  useEffect(() => {
    const loadPresentation = async () => {
      const { data, error } = await supabase.from('presentations').select('*').eq('id', id).single();
      if (error) {
        alert("Transmisión perdida o presentación no encontrada.");
        navigate('/');
        return;
      }
      setPresentation(data);
      setLoading(false);
    };

    loadPresentation();

    const channel = supabase.channel(`presentation-${id}`);
    channel
      .on('broadcast', { event: 'navigate' }, (payload) => {
        // En la versión Web, los comandos next/prev hacen scroll directo
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
        // Scroll libre
        window.scrollBy({ top: payload.payload.deltaY, behavior: 'auto' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate, laserX, laserY]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Sincronizando Proyector...</div>;
  if (!presentation) return null;

  const slidesData = presentation.slides_data || {};
  // Support both new sections[] format and old nasa{} format
  const sections = slidesData.sections || [];
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
    </div>
  );
}
