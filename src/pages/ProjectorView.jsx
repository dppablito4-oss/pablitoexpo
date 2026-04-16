import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectorView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const loadPresentation = async () => {
      const { data } = await supabase.from('presentations').select('*').eq('id', id).single();
      if (data) setPresentation(data);
    };
    loadPresentation();

    const channel = supabase.channel(`presentation-${id}`);

    channel
      .on('broadcast', { event: 'nav' }, (payload) => {
        const dir = payload.payload.direction;
        setCurrentSlideIndex(prev => {
           if (dir === 'next') return prev + 1;
           if (dir === 'prev') return Math.max(0, prev - 1);
           return prev;
        });
      })
      .on('broadcast', { event: 'laser' }, (payload) => {
        setLaserPos({
          x: payload.payload.x * window.innerWidth,
          y: payload.payload.y * window.innerHeight
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  if (!presentation) return <div style={{ color: 'white', padding: '20px' }}>Cargando proyector...</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#050510', position: 'relative' }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        X Salir del Proyector
      </button>
      
      {/* Slide Content */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
         <AnimatePresence mode="wait">
           <motion.div 
             key={currentSlideIndex}
             initial={{ opacity: 0, scale: 0.9, y: 50 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 1.1, y: -50 }}
             transition={{ duration: 0.5, type: 'spring' }}
             className="glass-panel"
             style={{ padding: '80px', textAlign: 'center', maxWidth: '80%', border: '1px solid rgba(0,240,255,0.2)' }}
           >
             <h1 style={{ fontSize: '5rem', color: 'var(--accent-primary)', marginBottom: '20px', textShadow: '0 0 30px rgba(0,240,255,0.4)' }}>
               {presentation.title}
             </h1>
             <p style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>Diapositiva #{currentSlideIndex + 1}</p>
             <p style={{ marginTop: '40px', fontSize: '1.2rem', color: '#fff' }}>Prueba usar tu celular como control remoto 📱✨</p>
           </motion.div>
         </AnimatePresence>
      </div>

      {/* Laser Virtual */}
      <motion.div 
        animate={{ left: laserPos.x, top: laserPos.y }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
        style={{
          position: 'absolute',
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
    </div>
  );
}
