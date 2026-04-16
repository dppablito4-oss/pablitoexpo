import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Importación de Plantillas Maestras
import HeroSlide from '../templates/HeroSlide';
import FeatureGrid from '../templates/FeatureGrid';
import ComparisonSlide from '../templates/ComparisonSlide';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState(null);

  useEffect(() => {
    const fetchPresentation = async () => {
      const { data, error } = await supabase.from('presentations').select('*').eq('id', id).single();
      
      if (error) {
        console.error(error);
        alert("Error de seguridad: Presentación no encontrada.");
        navigate('/');
        return;
      }
      
      // Si no tiene arreglo de slides, se lo creamos por defecto
      if (!data.slides_data || !data.slides_data.slides) {
          data.slides_data = { slides: [{ id: crypto.randomUUID(), type: 'hero', data: { title: 'Diapositiva Inicial', subtitle: 'Agrega contenido aquí' } }] };
      }

      setPresentation(data);
      if (data.slides_data.slides.length > 0) {
          setSelectedSlideId(data.slides_data.slides[0].id);
      }

      const isOwner = data.user_id === user.id;
      const isVip = data.editors_emails && data.editors_emails.includes(user.email);
      setCanEdit(isOwner || isVip);
      setLoading(false);
    };

    fetchPresentation();
  }, [id, user, navigate]);

  const saveToCloud = async () => {
      setSaving(true);
      try {
          const { error } = await supabase.from('presentations').update({ slides_data: presentation.slides_data }).eq('id', id);
          if (error) throw error;
      } catch (e) {
          alert("Error al guardar en la nube.");
      } finally {
          setSaving(false);
      }
  };

  // ----- FUNCIONES DE DIAPOSITIVAS -----
  const addSlide = (type) => {
    const newSlide = { 
       id: crypto.randomUUID(), 
       type, 
       data: {}, 
       config: { family: 'blur-slide', direction: 'up', physics: 'bouncy' } 
    };
    if (type === 'hero') newSlide.data = { title: 'Nuevo Título', subtitle: 'Subtítulo increíble' };
    if (type === 'feature_grid') newSlide.data = { heading: 'Puntos Clave', features: [{id: 1, title: 'Item 1', desc: 'Descripción', icon: 'star'}] };
    if (type === 'comparison') newSlide.data = { conceptA: 'Opción A', conceptB: 'Opción B', stats: [{label: 'Atributo', valA: 50, valB: 50}] };

    const newSlides = [...presentation.slides_data.slides, newSlide];
    setPresentation({ ...presentation, slides_data: { slides: newSlides } });
    setSelectedSlideId(newSlide.id);
  };

  const deleteSlide = (slideId) => {
      if(!window.confirm("¿Borrar esta diapositiva?")) return;
      const newSlides = presentation.slides_data.slides.filter(s => s.id !== slideId);
      setPresentation({ ...presentation, slides_data: { slides: newSlides }});
      if(selectedSlideId === slideId) setSelectedSlideId(newSlides[0]?.id || null);
  };

  const updateSlideData = (newFieldData) => {
      const newSlides = presentation.slides_data.slides.map(s => {
          if (s.id === selectedSlideId) {
              return { ...s, data: { ...s.data, ...newFieldData } };
          }
          return s;
      });
      setPresentation({ ...presentation, slides_data: { slides: newSlides } });
  };

  const updateSlideConfig = (newConfigData) => {
      const newSlides = presentation.slides_data.slides.map(s => {
          if (s.id === selectedSlideId) {
              return { ...s, config: { ...(s.config || {family:'fade', direction:'up', physics:'smooth'}), ...newConfigData } };
          }
          return s;
      });
      setPresentation({ ...presentation, slides_data: { slides: newSlides } });
  };

  // ----- RENDERIZADORES DE FORMULARIOS -----
  const renderEditorForm = () => {
    const slide = presentation.slides_data.slides.find(s => s.id === selectedSlideId);
    if (!slide) return <p className="text-neutral-500">Selecciona una diapositiva</p>;
    
    const slideData = slide.data || {};

    if (slide.type === 'hero') {
        return (
            <div className="flex flex-col gap-4">
                <label className="text-xs text-neutral-400">Título Principal</label>
                <input type="text" value={slideData.title || ''} onChange={(e)=>updateSlideData({title: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
                
                <label className="text-xs text-neutral-400">Subtítulo</label>
                <textarea rows={3} value={slideData.subtitle || ''} onChange={(e)=>updateSlideData({subtitle: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
                
                <label className="text-xs text-neutral-400">Texto del Botón (Opcional)</label>
                <input type="text" value={slideData.buttonText || ''} onChange={(e)=>updateSlideData({buttonText: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
            </div>
        );
    }

    if (slide.type === 'feature_grid') {
        return (
            <div className="flex flex-col gap-4">
                <label className="text-xs text-neutral-400">Encabezado</label>
                <input type="text" value={slideData.heading || ''} onChange={(e)=>updateSlideData({heading: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
                
                <hr className="border-neutral-800 my-2" />
                <h4 className="text-sm font-bold text-accent-primary">Tarjetas</h4>
                {slideData.features?.map((feat, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900 border border-neutral-800 rounded mb-2">
                        <input placeholder="Título" value={feat.title || ''} onChange={(e) => {
                            const newFeats = [...(slideData.features||[])]; newFeats[idx].title = e.target.value; updateSlideData({features: newFeats});
                        }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm mb-2" />
                        <textarea placeholder="Descripción" value={feat.desc || ''} onChange={(e) => {
                            const newFeats = [...(slideData.features||[])]; newFeats[idx].desc = e.target.value; updateSlideData({features: newFeats});
                        }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm mb-2" rows={2}/>
                        <select value={feat.icon || 'zap'} onChange={(e) => {
                            const newFeats = [...(slideData.features||[])]; newFeats[idx].icon = e.target.value; updateSlideData({features: newFeats});
                        }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm">
                            <option value="zap">Rayo</option>
                            <option value="shield">Escudo</option>
                            <option value="cpu">Procesador</option>
                            <option value="activity">Actividad</option>
                            <option value="star">Estrella</option>
                            <option value="rocket">Cohete</option>
                        </select>
                        <button onClick={()=>{
                            const newFeats = (slideData.features||[]).filter((_, i) => i !== idx); updateSlideData({features: newFeats});
                        }} className="mt-2 text-xs text-red-500 w-full text-right hover:text-red-400">Eliminar Tarjeta</button>
                    </div>
                ))}
                <button onClick={()=>{
                    const newFeats = [...(slideData.features||[]), {id: Date.now(), title: 'Nueva', desc: 'Desc', icon: 'star'}];
                    updateSlideData({features: newFeats});
                }} className="text-xs text-center border border-neutral-700 py-2 rounded hover:bg-neutral-800">+ Añadir Tarjeta</button>
            </div>
        );
    }

    if (slide.type === 'comparison') {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-blue-400 font-bold">Concepto A</label>
                        <input type="text" value={slideData.conceptA || ''} onChange={(e)=>updateSlideData({conceptA: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-purple-400 font-bold">Concepto B</label>
                        <input type="text" value={slideData.conceptB || ''} onChange={(e)=>updateSlideData({conceptB: e.target.value})} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full" />
                    </div>
                </div>
                
                <hr className="border-neutral-800 my-2" />
                <h4 className="text-sm font-bold text-accent-primary">Estadísticas de Comparación</h4>
                {slideData.stats?.map((stat, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900 border border-neutral-800 rounded mb-2">
                        <label className="text-xs text-neutral-400">Métrica</label>
                        <input type="text" value={stat.label || ''} onChange={(e) => {
                            const newStats = [...(slideData.stats||[])]; newStats[idx].label = e.target.value; updateSlideData({stats: newStats});
                        }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm mb-2" />
                        
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-blue-400">Valor A (%)</label>
                                <input type="number" min="0" max="100" value={stat.valA || 0} onChange={(e) => {
                                    const newStats = [...(slideData.stats||[])]; newStats[idx].valA = Number(e.target.value); updateSlideData({stats: newStats});
                                }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-purple-400">Valor B (%)</label>
                                <input type="number" min="0" max="100" value={stat.valB || 0} onChange={(e) => {
                                    const newStats = [...(slideData.stats||[])]; newStats[idx].valB = Number(e.target.value); updateSlideData({stats: newStats});
                                }} className="bg-black border border-neutral-700 rounded p-1 text-white w-full text-sm" />
                            </div>
                        </div>
                        <button onClick={()=>{
                            const newStats = (slideData.stats||[]).filter((_, i) => i !== idx); updateSlideData({stats: newStats});
                        }} className="mt-2 text-xs text-red-500 w-full text-right hover:text-red-400">Eliminar Métrica</button>
                    </div>
                ))}
                <button onClick={()=>{
                    const newStats = [...(slideData.stats||[]), {label: 'Nueva Métrica', valA: 50, valB: 50}];
                    updateSlideData({stats: newStats});
                }} className="text-xs text-center border border-neutral-700 py-2 rounded hover:bg-neutral-800">+ Añadir Métrica</button>
            </div>
        );
    }

    return <p className="text-neutral-500">Plantilla seleccionada no soportada.</p>;
  };

  const renderConfigForm = () => {
        const slide = presentation.slides_data.slides.find(s => s.id === selectedSlideId);
        if (!slide) return null;
        const conf = slide.config || {family:'blur-slide', direction:'up', physics:'bouncy'};
        
        return (
            <div className="mt-8 border-t border-neutral-800 pt-6">
                <h4 className="text-sm font-bold text-accent-primary mb-4 flex items-center gap-2">🎬 Físicas de Transición</h4>
                
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs text-neutral-400">Familia Base</label>
                        <select value={conf.family} onChange={(e)=>updateSlideConfig({family: e.target.value})} className="bg-black border border-neutral-700 rounded p-1.5 text-white w-full text-sm mt-1">
                            <option value="fade">Fantasma Libre (Fade)</option>
                            <option value="slide">Deslizamiento (Slide)</option>
                            <option value="blur-slide">Material (Blur Slide)</option>
                            <option value="scale-up">Empuje (Scale Up)</option>
                            <option value="glitch">Cyberpunk (Glitch)</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-neutral-400">Origen</label>
                            <select value={conf.direction} onChange={(e)=>updateSlideConfig({direction: e.target.value})} className="bg-black border border-neutral-700 rounded p-1.5 text-white w-full text-sm mt-1">
                                <option value="up">Desde Abajo</option>
                                <option value="down">Desde Arriba</option>
                                <option value="left">Desde Derecha</option>
                                <option value="right">Desde Izquierda</option>
                                <option value="none">Centro</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-neutral-400">Rebote</label>
                            <select value={conf.physics} onChange={(e)=>updateSlideConfig({physics: e.target.value})} className="bg-black border border-neutral-700 rounded p-1.5 text-white w-full text-sm mt-1">
                                <option value="smooth">Smooth (Apple)</option>
                                <option value="snappy">Snappy (Corto)</option>
                                <option value="bouncy">Bouncy (Liga)</option>
                                <option value="linear">Linear (Robot)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
  };


  // MAIN RENDER
  if (loading) return <div className="text-neutral-500 p-10 text-center">Iniciando Motor Tailwind...</div>;
  if (!presentation) return null;

  const currentSlide = presentation.slides_data.slides.find(s => s.id === selectedSlideId);

  return (
    <div className="h-screen w-full bg-neutral-950 flex flex-col overflow-hidden text-neutral-200">
      
      {/* HEADER NAVBAR */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm flex justify-between items-center px-6 shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-accent-primary m-0 font-bold tracking-wider text-xl drop-shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                {presentation.title} <span className="text-neutral-500 font-normal">/ Editor AI</span>
            </h2>
            {!canEdit && (
                <span className="bg-red-500/20 border border-red-500/50 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                    👁️ MODO VISOR (SOLO LECTURA)
                </span>
            )}
        </div>
        <div className="flex gap-3">
          {canEdit && (
              <button onClick={saveToCloud} disabled={saving} className="btn-cyber !w-auto !py-2 !px-6 bg-emerald-500/10 border-emerald-500/50 text-emerald-400">
                {saving ? 'Guardando...' : '💾 Guardar en Nube'}
              </button>
          )}
          <button onClick={() => navigate('/')} className="btn-cyber !w-auto !py-2 !px-6 border-neutral-700 text-neutral-400">
            Salir
          </button>
        </div>
      </header>
      
      {/* MAIN WORKSPACE 3-COLUMNS */}
      <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT PANEL: SLIDE LIST */}
          <div className="w-64 border-r border-neutral-800 bg-neutral-900/30 flex flex-col overflow-y-auto">
              {/* Add Buttons */}
              {canEdit && (
                  <div className="p-4 border-b border-neutral-800 space-y-2 shrink-0">
                      <p className="text-xs font-bold text-neutral-500 mb-2 uppercase text-center">Añadir Plantilla</p>
                      <button onClick={()=>addSlide('hero')} className="w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700">+ Título Épico</button>
                      <button onClick={()=>addSlide('feature_grid')} className="w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700">+ Cuadrícula Key Features</button>
                      <button onClick={()=>addSlide('comparison')} className="w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700">+ Barras de Comparación VS</button>
                  </div>
              )}

              {/* Thumbnails */}
              <div className="flex-1 p-4 space-y-3">
                  {presentation.slides_data.slides.map((slide, i) => {
                      const sdata = slide.data || {};
                      return (
                      <div 
                          key={slide.id} 
                          onClick={() => setSelectedSlideId(slide.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative ${selectedSlideId === slide.id ? 'border-accent-primary bg-accent-primary/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'}`}
                      >
                          <div className="text-xs text-neutral-400 mb-1 font-mono">D.{i+1} - {slide.type}</div>
                          <div className="text-sm text-white font-bold truncate">
                            {sdata.title || sdata.heading || sdata.conceptA || "Diapositiva"}
                          </div>
                      </div>
                      )
                  })}
              </div>
          </div>

          {/* CENTER PANEL: PREVIEW CANVAS */}
          <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            
            <div className="w-full max-w-5xl aspect-video bg-black rounded-lg shadow-2xl border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                
                {/* El renderizador inyecta el componente con AnimatePresence para previsualizar físicas */}
                <AnimatePresence mode="wait">
                    {currentSlide && (
                        <motion.div 
                            key={currentSlide.id + JSON.stringify(currentSlide.config)}
                            className="w-full h-full pointer-events-none scale-[0.6] origin-center absolute inset-0"
                        >
                            {currentSlide.type === 'hero' && <HeroSlide config={currentSlide.config} data={currentSlide.data} />}
                            {currentSlide.type === 'feature_grid' && <FeatureGrid config={currentSlide.config} data={currentSlide.data} />}
                            {currentSlide.type === 'comparison' && <ComparisonSlide config={currentSlide.config} data={currentSlide.data} />}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cover div para que clicks accidentales en la preview no activen botones de la plantilla */}
                <div className="absolute inset-0 z-50"></div>
                
                {/* Capa de aviso flotante si visor */}
                {!canEdit && (
                    <div className="absolute top-4 right-4 bg-red-500/20 text-red-500 text-xs px-3 py-1 rounded-full border border-red-500/50 backdrop-blur-md">
                        MIRA PERO NO TOQUES
                    </div>
                )}
            </div>
            
            <p className="mt-6 text-neutral-600 font-mono text-sm tracking-widest uppercase">Canvas Preview</p>
          </div>

          {/* RIGHT PANEL: SLIDE FORM MODIFIER */}
          <div className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col overflow-hidden">
              <div className="h-12 border-b border-neutral-800 flex items-center justify-center shrink-0">
                  <h3 className="text-sm font-bold text-accent-primary uppercase tracking-widest">Inyector de Datos</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  {!canEdit ? (
                      <p className="text-neutral-500 text-center text-sm p-4 border border-dashed border-neutral-700 rounded">
                        Herramientas inactivas. Solo el creador o editores VIP pueden inyectar datos aquí.
                      </p>
                  ) : (
                      <>
                        {renderEditorForm()}
                        {renderConfigForm()}
                        
                        {currentSlide && (
                            <div className="mt-10 border-t border-red-900/30 pt-6">
                                <button onClick={() => deleteSlide(currentSlide.id)} className="w-full px-4 py-2 border border-red-900/50 text-red-500/80 hover:bg-red-900/20 hover:text-red-400 rounded text-sm transition-colors">
                                    🗑️ Borrar Diapositiva
                                </button>
                            </div>
                        )}
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
