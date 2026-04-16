import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

// Plantillas Maestras
import HeroSlide from '../templates/HeroSlide';
import FeatureGrid from '../templates/FeatureGrid';
import ComparisonSlide from '../templates/ComparisonSlide';

export default function ProjectorView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
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
        if (payload.payload.direction === 'next') {
          setCurrentSlideIndex(prev => prev + 1);
        } else if (payload.payload.direction === 'prev') {
          setCurrentSlideIndex(prev => Math.max(0, prev - 1));
        }
      })
      .on('broadcast', { event: 'laser' }, (payload) => {
        laserX.set(payload.payload.x * window.innerWidth);
        laserY.set(payload.payload.y * window.innerHeight);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate, laserX, laserY]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Sincronizando Proyector...</div>;
  if (!presentation) return null;

  const slides = presentation.slides_data?.slides || [];
  // Asegurarnos de no pasarnos del límite del arreglo
  const safeIndex = Math.min(currentSlideIndex, slides.length - 1);
  const currentSlide = slides[safeIndex];

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative cursor-none">
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSlide?.id || 'empty'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full absolute inset-0"
        >
            {currentSlide?.type === 'hero' && <HeroSlide config={currentSlide.config} data={currentSlide.data} />}
            {currentSlide?.type === 'feature_grid' && <FeatureGrid config={currentSlide.config} data={currentSlide.data} />}
            {currentSlide?.type === 'comparison' && <ComparisonSlide config={currentSlide.config} data={currentSlide.data} />}
            {(!currentSlide || !['hero', 'feature_grid', 'comparison'].includes(currentSlide.type)) && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white bg-neutral-900">
                    <h1 className="text-4xl">Diapositiva Vacía / No Soportada</h1>
                </div>
            )}
        </motion.div>
      </AnimatePresence>

      {/* Laser Virtual */}
      <motion.div 
        style={{
          left: smoothX,
          top: smoothY,
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
      
      {/* UI Flotante Decorativa */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-neutral-600 tracking-widest z-50 mix-blend-difference">
        UPLINK: ACTIVO | PABLITO EXPO ENGINE
      </div>
      <div className="absolute bottom-4 right-4 text-white/30 font-mono z-50">
        {safeIndex + 1} / {slides.length}
      </div>
    </div>
  );
}
