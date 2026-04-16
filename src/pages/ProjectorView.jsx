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
        setCurrentSlideIndex(prev => {
          let newIdx = prev;
          if (payload.payload.direction === 'next') {
            newIdx = prev + 1;
          } else if (payload.payload.direction === 'prev') {
            newIdx = Math.max(0, prev - 1);
          }
          const slidesCount = presentation?.slides_data?.slides?.length || 0;
          newIdx = Math.min(newIdx, slidesCount - 1);
          
          if (newIdx !== prev) {
             const target = document.getElementById(`section-${newIdx}`);
             if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
          return newIdx;
        });
      })
      .on('broadcast', { event: 'laser' }, (payload) => {
        laserX.set(payload.payload.x * window.innerWidth);
        laserY.set(payload.payload.y * window.innerHeight);
      })
      .on('broadcast', { event: 'remote-scroll' }, (payload) => {
        // Scroll continuo suave
        window.scrollBy({ top: payload.payload.deltaY, behavior: 'auto' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate, laserX, laserY, presentation]);

  // Rastreo local del scroll para sincronizar texto (opcional)
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.slide-section');
      let current = 0;
      sections.forEach((sec, index) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top >= -window.innerHeight/2 && rect.top < window.innerHeight/2) {
          current = index;
        }
      });
      if (current !== currentSlideIndex) setCurrentSlideIndex(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSlideIndex]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Sincronizando Proyector...</div>;
  if (!presentation) return null;

  const slides = presentation.slides_data?.slides || [];

  return (
    <div className="h-screen w-full bg-black overflow-y-auto snap-y snap-mandatory relative cursor-none scroll-smooth">
      
      {slides.map((slide, index) => {
          const TemplateConfig = slide.config || {};
          const TemplateData = slide.data || {};
          const bgImage = TemplateData.bgImage;

          return (
            <motion.div 
              key={slide.id}
              id={`section-${index}`}
              className="slide-section w-full h-screen snap-start relative overflow-hidden flex items-center justify-center"
            >
                {/* Parallax Background */}
                {bgImage && (
                    <motion.div 
                        initial={{ scale: 1.1 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                    </motion.div>
                )}

                <div className="relative z-10 w-full h-full">
                  {slide.type === 'hero' && <HeroSlide config={TemplateConfig} data={TemplateData} />}
                  {slide.type === 'feature_grid' && <FeatureGrid config={TemplateConfig} data={TemplateData} />}
                  {slide.type === 'comparison' && <ComparisonSlide config={TemplateConfig} data={TemplateData} />}
                  {!['hero', 'feature_grid', 'comparison'].includes(slide.type) && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white bg-neutral-900 border border-neutral-800">
                          <h1 className="text-4xl">Bloque No Soportado</h1>
                      </div>
                  )}
                </div>
            </motion.div>
          );
      })}

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
      <div className="fixed bottom-4 right-4 text-white/30 font-mono z-50 mix-blend-difference">
        {currentSlideIndex + 1} / {slides.length}
      </div>
    </div>
  );
}
