import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import NasaWebTemplate from '../templates/NasaWebTemplate';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true); // Toggle para panel lateral

  useEffect(() => {
    const fetchPresentation = async () => {
      const { data, error } = await supabase.from('presentations').select('*').eq('id', id).single();
      
      if (error) {
        alert("Presentación no encontrada.");
        navigate('/');
        return;
      }
      
      // Pivot NASA: Inicializar estructura de la web pura si es vieja o no existe
      if (!data.slides_data || !data.slides_data.nasa) {
          data.slides_data = { 
              nasa: {
                  heroTitle: "NUEVO DESCUBRIMIENTO",
                  heroSubtitle: "Explorando las fronteras del cosmos.",
                  aboutHeading: "Misión Principal",
                  aboutText: "Tu texto épico de misión aquí.",
                  bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                  features: [
                      { id: 1, title: "METRICA 1", val: "100", desc: "Aceleración" },
                      { id: 2, title: "METRICA 2", val: "0", desc: "Gravedad" },
                      { id: 3, title: "METRICA 3", val: "Act", desc: "Estado de Motor" }
                  ]
              } 
          };
      }

      setPresentation(data);
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
          alert("Error de guardado: " + e.message);
      } finally {
          setSaving(false);
      }
  };

  const updateNasaData = (newData) => {
      setPresentation(prev => ({
          ...prev,
          slides_data: {
              ...prev.slides_data,
              nasa: { ...prev.slides_data.nasa, ...newData }
          }
      }));
  };

  const updateFeature = (idx, field, value) => {
      const newFeatures = [...presentation.slides_data.nasa.features];
      newFeatures[idx] = { ...newFeatures[idx], [field]: value };
      updateNasaData({ features: newFeatures });
  };

  // MAIN RENDER
  if (loading) return <div className="text-neutral-500 p-10 text-center">Iniciando Motor N.A.S.A...</div>;
  if (!presentation) return null;

  const nasaData = presentation.slides_data.nasa;

  return (
    <div className="h-screen w-full bg-neutral-950 flex overflow-hidden">
      
      {/* LEFT PANEL: NAVEGADOR DE SECCIONES (TIPO WEBFLOW) */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col z-50 shrink-0">
          <div className="p-4 border-b border-neutral-800">
              <h2 className="text-accent-primary font-bold tracking-wider text-lg truncate">
                  {presentation.title}
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono mt-1">Web Builder V3</p>
          </div>
          
          <div className="p-4 flex-1 space-y-2">
              <p className="text-xs font-bold text-neutral-500 mb-4 uppercase">Navegador de Secciones</p>
              
              <button onClick={() => document.getElementById('section-hero')?.scrollIntoView({behavior: 'smooth'})} className="w-full text-left px-3 py-2 text-sm text-white bg-black hover:bg-neutral-800 rounded border border-neutral-800">
                  1. Portada (Hero)
              </button>
              <button onClick={() => document.getElementById('section-about')?.scrollIntoView({behavior: 'smooth'})} className="w-full text-left px-3 py-2 text-sm text-white bg-black hover:bg-neutral-800 rounded border border-neutral-800">
                  2. Misión (Acerca De)
              </button>
              <button onClick={() => document.getElementById('section-stats')?.scrollIntoView({behavior: 'smooth'})} className="w-full text-left px-3 py-2 text-sm text-white bg-black hover:bg-neutral-800 rounded border border-neutral-800">
                  3. Datos Técnicos (Stats)
              </button>
          </div>

          <div className="p-4 border-t border-neutral-800 space-y-2">
              {canEdit && (
                  <button onClick={saveToCloud} disabled={saving} className="btn-cyber !w-full !py-2 bg-emerald-500/10 border-emerald-500/50 text-emerald-400">
                    {saving ? 'Guardando...' : '💾 Desplegar a Nube'}
                  </button>
              )}
              <button onClick={() => navigate('/')} className="btn-cyber !w-full !py-2 border-neutral-700 text-neutral-400">
                  Volver a Base
              </button>
          </div>
      </div>

      {/* CENTER BUILDER CANVA - 100% Full Bleed */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth bg-black" style={{scrollBehavior: 'smooth'}}>
            {/* AQUÍ VIVE LA MEGA PLANTILLA NASA RENDERIZADA */}
            <NasaWebTemplate data={nasaData} />
            
            {/* Overlays de solo lectura */}
            {!canEdit && (
                <div className="fixed top-4 right-4 bg-red-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] z-50">
                    MODO SOLO LECTURA
                </div>
            )}
      </div>

      {/* RIGHT PANEL: EDITOR DE CONTENIDO (INSPECTOR CSS) */}
      <div className={`border-l border-neutral-800 bg-neutral-900/80 backdrop-blur z-50 transition-all duration-300 flex flex-col shrink-0 ${editorOpen ? 'w-80' : 'w-0 border-l-0'}`}>
          {editorOpen && (
              <>
                  <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
                      <h3 className="text-sm font-bold text-accent-primary uppercase tracking-widest">Inspector de Pagina</h3>
                      <button onClick={()=>setEditorOpen(false)} className="text-neutral-500 hover:text-white">→</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      {!canEdit ? (
                          <p className="text-neutral-500 text-center text-sm p-4 border border-dashed border-neutral-700 rounded">
                            Solo los administradores pueden alterar el código fuente de esta web.
                          </p>
                      ) : (
                          <div className="flex flex-col gap-6">
                              {/* Portada */}
                              <div className="space-y-3">
                                  <h4 className="text-xs text-fuchsia-400 font-bold uppercase border-b border-neutral-800 pb-1">1. Fondo Cósmico</h4>
                                  <input type="text" placeholder="URL de fondo estelar..." value={nasaData.bgImage || ''} onChange={(e)=>updateNasaData({bgImage: e.target.value})} className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                                  <p className="text-[10px] text-neutral-500">Aplica a todo el lienzo.</p>
                              </div>

                              <div className="space-y-3">
                                  <h4 className="text-xs text-blue-400 font-bold uppercase border-b border-neutral-800 pb-1">2. Tipografía Hero</h4>
                                  <input type="text" value={nasaData.heroTitle || ''} onChange={(e)=>updateNasaData({heroTitle: e.target.value})} className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-sm font-bold" />
                                  <textarea rows={2} value={nasaData.heroSubtitle || ''} onChange={(e)=>updateNasaData({heroSubtitle: e.target.value})} className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                              </div>

                              <div className="space-y-3 mt-4">
                                  <h4 className="text-xs text-emerald-400 font-bold uppercase border-b border-neutral-800 pb-1">3. Misión (About)</h4>
                                  <input type="text" value={nasaData.aboutHeading || ''} onChange={(e)=>updateNasaData({aboutHeading: e.target.value})} className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-sm font-bold" />
                                  <textarea rows={4} value={nasaData.aboutText || ''} onChange={(e)=>updateNasaData({aboutText: e.target.value})} className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                              </div>

                              <div className="space-y-3 mt-4">
                                  <h4 className="text-xs text-orange-400 font-bold uppercase border-b border-neutral-800 pb-1">4. Telemetría (Stars)</h4>
                                  {nasaData.features?.map((feat, idx) => (
                                      <div key={idx} className="p-3 bg-black border border-neutral-800 rounded">
                                          <input placeholder="Abreviatura/Valor Gigante" value={feat.val || ''} onChange={(e)=>updateFeature(idx, 'val', e.target.value)} className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-xs mb-1 font-black" />
                                          <input placeholder="Título Técnico" value={feat.title || ''} onChange={(e)=>updateFeature(idx, 'title', e.target.value)} className="bg-transparent text-cyan-400 w-full text-xs mb-1 font-bold outline-none" />
                                          <input placeholder="Descripción de sistema..." value={feat.desc || ''} onChange={(e)=>updateFeature(idx, 'desc', e.target.value)} className="bg-transparent text-neutral-500 w-full text-[10px] font-mono outline-none" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </>
          )}
      </div>

      {/* Botón flotante para reabrir inspector si se cerró */}
      {!editorOpen && (
          <button onClick={() => setEditorOpen(true)} className="fixed top-4 right-4 bg-neutral-900 border border-neutral-700 text-white p-2 rounded-full z-50 hover:bg-neutral-800 shadow-xl">
              ⚙️
          </button>
      )}

    </div>
  );
}
