import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

// Secciones disponibles
const SECTIONS = [
  { id: 'hero',  label: '1. Portada (Hero)' },
  { id: 'about', label: '2. Misión (Acerca De)' },
  { id: 'stats', label: '3. Datos Técnicos' },
];

// ── Elemento arrastrable dentro del canvas ──────────────────────────────────
function DraggableEl({ el, isSelected, onSelect, onDragEnd, containerRef }) {
  const startRef = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(el.id);
    const rect = containerRef.current.getBoundingClientRect();
    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: parseFloat(el.x),
      elY: parseFloat(el.y),
      cW: rect.width,
      cH: rect.height,
    };

    const onMove = (e2) => {
      const s = startRef.current;
      const dx = ((e2.clientX - s.mouseX) / s.cW) * 100;
      const dy = ((e2.clientY - s.mouseY) / s.cH) * 100;
      const nx = Math.max(0, Math.min(90, s.elX + dx)).toFixed(1);
      const ny = Math.max(0, Math.min(90, s.elY + dy)).toFixed(1);
      onDragEnd(el.id, `${nx}%`, `${ny}%`);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: el.x ?? '10%',
        top: el.y ?? '10%',
        cursor: 'grab',
        zIndex: 40,
        userSelect: 'none',
        outline: isSelected ? '2px dashed #00f0ff' : 'none',
        outlineOffset: '4px',
        padding: '2px',
      }}
    >
      {el.type === 'text' && (
        <span style={{
          color: el.color || '#ffffff',
          fontSize: el.fontSize ? `${el.fontSize}px` : '28px',
          fontWeight: el.fontWeight || 'bold',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.2,
        }}>
          {el.content || 'Texto'}
        </span>
      )}
      {el.type === 'image' && el.src && (
        <img
          src={el.src}
          alt=""
          style={{
            width: el.width ? `${el.width}px` : '200px',
            height: 'auto',
            borderRadius: el.rounded ? '12px' : '0',
            opacity: el.opacity ?? 1,
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}
    </div>
  );
}

// ── Preview de sección (con overlay drag-and-drop) ───────────────────────────
function SectionCanvas({ sectionId, nasaData, isActive, bgImage, onElementDrag, onElementSelect, selectedElId }) {
  const containerRef = useRef(null);
  const freeElements = (nasaData.freeElements || []).filter(e => e.sectionId === sectionId);

  const sectionBg = {
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden transition-all duration-300 border-b-2
        ${isActive ? 'border-cyan-500/50' : 'border-neutral-800 opacity-70 hover:opacity-100'}`}
      style={{ height: '420px', ...sectionBg }}
    >
      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 bg-black/55 z-10" />

      {/* Label sección */}
      <div className="absolute top-3 left-3 text-[10px] font-mono text-white/30 z-50 uppercase tracking-widest">
        {SECTIONS.find(s => s.id === sectionId)?.label}
      </div>

      {/* Elementos flotantes arrastrables */}
      {freeElements.map(el => (
        <DraggableEl
          key={el.id}
          el={el}
          isSelected={selectedElId === el.id}
          onSelect={onElementSelect}
          onDragEnd={onElementDrag}
          containerRef={containerRef}
        />
      ))}

      {/* Hint si no hay elementos */}
      {isActive && freeElements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <p className="text-neutral-600 text-sm font-mono">Añade elementos desde el panel →</p>
        </div>
      )}
    </div>
  );
}

// ── Inspector del elemento seleccionado ─────────────────────────────────────
function ElementInspector({ element, onChange, onDelete }) {
  if (!element) return (
    <p className="text-neutral-600 text-xs text-center py-4 border border-dashed border-neutral-800 rounded">
      Selecciona un elemento en el canvas para editarlo aquí
    </p>
  );

  return (
    <div className="space-y-3 p-3 bg-black border border-neutral-800 rounded">
      <div className="flex justify-between items-center">
        <span className="text-xs text-cyan-400 font-bold uppercase">{element.type === 'text' ? '📝 Texto' : '🖼️ Imagen'}</span>
        <button onClick={onDelete} className="text-[10px] text-red-500 hover:text-red-400">Eliminar</button>
      </div>

      {element.type === 'text' && (
        <>
          <textarea
            value={element.content || ''}
            onChange={e => onChange({ content: e.target.value })}
            rows={3}
            className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full text-sm"
            placeholder="Escribe aquí..."
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500">Tamaño (px)</label>
              <input type="number" min="10" max="200" value={element.fontSize || 28}
                onChange={e => onChange({ fontSize: Number(e.target.value) })}
                className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">Color</label>
              <input type="color" value={element.color || '#ffffff'}
                onChange={e => onChange({ color: e.target.value })}
                className="w-full h-8 rounded border border-neutral-700 bg-neutral-900 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500">Grosor</label>
            <select value={element.fontWeight || 'bold'}
              onChange={e => onChange({ fontWeight: e.target.value })}
              className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-sm">
              <option value="normal">Regular</option>
              <option value="bold">Bold</option>
              <option value="900">Black (900)</option>
            </select>
          </div>
        </>
      )}

      {element.type === 'image' && (
        <>
          <input type="text" value={element.src || ''} onChange={e => onChange({ src: e.target.value })}
            placeholder="URL de imagen..."
            className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-full text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500">Ancho (px)</label>
              <input type="number" min="50" max="1200" value={element.width || 200}
                onChange={e => onChange({ width: Number(e.target.value) })}
                className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">Opacidad</label>
              <input type="range" min="0.1" max="1" step="0.05" value={element.opacity ?? 1}
                onChange={e => onChange({ opacity: Number(e.target.value) })}
                className="w-full mt-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rounded" checked={!!element.rounded}
              onChange={e => onChange({ rounded: e.target.checked })} />
            <label htmlFor="rounded" className="text-xs text-neutral-400">Bordes redondeados</label>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
        <div>
          <label className="text-[10px] text-neutral-500">X (%)</label>
          <input type="number" min="0" max="90" value={parseFloat(element.x) || 10}
            onChange={e => onChange({ x: `${e.target.value}%` })}
            className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-sm" />
        </div>
        <div>
          <label className="text-[10px] text-neutral-500">Y (%)</label>
          <input type="number" min="0" max="90" value={parseFloat(element.y) || 10}
            onChange={e => onChange({ y: `${e.target.value}%` })}
            className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-sm" />
        </div>
      </div>
    </div>
  );
}

// ── EDITOR PRINCIPAL ─────────────────────────────────────────────────────────
export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('hero');
  const [selectedElId, setSelectedElId] = useState(null);
  const [rightTab, setRightTab] = useState('content'); // 'content' | 'elements'

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('presentations').select('*').eq('id', id).single();
      if (error) { alert("Presentación no encontrada."); navigate('/'); return; }

      if (!data.slides_data?.nasa) {
        data.slides_data = {
          nasa: {
            heroTitle: "NUEVO DESCUBRIMIENTO",
            heroSubtitle: "Explorando las fronteras del cosmos.",
            aboutHeading: "Misión Principal",
            aboutText: "Tu texto épico de misión aquí.",
            bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            freeElements: [],
            features: [
              { id: 1, title: "METRICA 1", val: "100", desc: "Aceleración" },
              { id: 2, title: "METRICA 2", val: "0",   desc: "Gravedad" },
              { id: 3, title: "METRICA 3", val: "Act", desc: "Estado" }
            ]
          }
        };
      }
      if (!data.slides_data.nasa.freeElements) {
        data.slides_data.nasa.freeElements = [];
      }

      setPresentation(data);
      setCanEdit(data.user_id === user.id || (data.editors_emails?.includes(user.email)));
      setLoading(false);
    };
    fetch();
  }, [id, user, navigate]);

  const saveToCloud = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('presentations').update({ slides_data: presentation.slides_data }).eq('id', id);
      if (error) throw error;
    } catch (e) { alert("Error de guardado: " + e.message); }
    finally { setSaving(false); }
  };

  const updateNasaData = useCallback((newData) => {
    setPresentation(prev => ({
      ...prev,
      slides_data: { ...prev.slides_data, nasa: { ...prev.slides_data.nasa, ...newData } }
    }));
  }, []);

  const addFreeElement = (type) => {
    const newEl = {
      id: crypto.randomUUID(),
      sectionId: activeSectionId,
      type,
      x: '10%', y: '10%',
      content: type === 'text' ? 'Escribe aquí' : '',
      fontSize: 36, color: '#ffffff', fontWeight: 'bold',
      src: '', width: 250, opacity: 1, rounded: false,
    };
    const cur = presentation.slides_data.nasa;
    updateNasaData({ freeElements: [...(cur.freeElements || []), newEl] });
    setSelectedElId(newEl.id);
    setRightTab('elements');
  };

  const updateFreeElement = useCallback((elId, newData) => {
    setPresentation(prev => {
      const nasa = prev.slides_data.nasa;
      const newEls = (nasa.freeElements || []).map(e => e.id === elId ? { ...e, ...newData } : e);
      return { ...prev, slides_data: { ...prev.slides_data, nasa: { ...nasa, freeElements: newEls } } };
    });
  }, []);

  const deleteFreeElement = (elId) => {
    const cur = presentation.slides_data.nasa;
    updateNasaData({ freeElements: (cur.freeElements || []).filter(e => e.id !== elId) });
    setSelectedElId(null);
  };

  const handleElementDrag = useCallback((elId, x, y) => {
    updateFreeElement(elId, { x, y });
  }, [updateFreeElement]);

  const updateFeature = (idx, field, value) => {
    const newFeats = [...(presentation.slides_data.nasa.features || [])];
    newFeats[idx] = { ...newFeats[idx], [field]: value };
    updateNasaData({ features: newFeats });
  };

  if (loading) return <div className="text-neutral-500 p-10 text-center">Iniciando Motor...</div>;
  if (!presentation) return null;

  const nasa = presentation.slides_data.nasa;
  const selectedEl = (nasa.freeElements || []).find(e => e.id === selectedElId) || null;
  const activeSection = SECTIONS.find(s => s.id === activeSectionId);

  return (
    <div className="h-screen w-full bg-neutral-950 flex overflow-hidden">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="w-60 border-r border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col z-50 shrink-0">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-accent-primary font-bold tracking-wide text-base truncate">{presentation.title}</h2>
          <p className="text-[10px] text-neutral-500 font-mono">Web Builder Pro</p>
        </div>

        <div className="p-3 flex-1 space-y-1">
          <p className="text-[10px] font-bold text-neutral-600 mb-3 uppercase tracking-widest">Secciones</p>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSectionId(s.id); document.getElementById(`canvas-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`w-full text-left px-3 py-2 text-sm rounded border transition-all
                ${activeSectionId === s.id
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-black hover:bg-neutral-800 border-neutral-800 text-neutral-400'}`}
            >
              {s.label}
            </button>
          ))}

          {canEdit && (
            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <p className="text-[10px] text-neutral-600 uppercase tracking-widest">Añadir a "{activeSection?.label}"</p>
              <button onClick={() => addFreeElement('text')}
                className="w-full text-left px-3 py-2 text-xs bg-fuchsia-900/30 hover:bg-fuchsia-900/50 border border-fuchsia-800/50 rounded text-fuchsia-300">
                + Texto Libre
              </button>
              <button onClick={() => addFreeElement('image')}
                className="w-full text-left px-3 py-2 text-xs bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800/50 rounded text-blue-300">
                + Imagen Libre
              </button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-neutral-800 space-y-2">
          {canEdit && (
            <button onClick={saveToCloud} disabled={saving}
              className="btn-cyber !w-full !py-2 bg-emerald-500/10 border-emerald-500/50 text-emerald-400 text-sm">
              {saving ? 'Guardando...' : '💾 Guardar'}
            </button>
          )}
          <button onClick={() => window.open(`/projector/${id}`, '_blank')}
            className="btn-cyber !w-full !py-2 border-neutral-700 text-neutral-400 text-sm">
            👁 Vista Proyector
          </button>
          <button onClick={() => navigate('/')}
            className="btn-cyber !w-full !py-2 border-neutral-800 text-neutral-600 text-sm">
            ← Volver
          </button>
        </div>
      </div>

      {/* ── CANVAS CENTRAL (Full-Bleed, scrollable) ── */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 relative">
        {/* Instrucción flotante */}
        {canEdit && (
          <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-neutral-800 px-4 py-2 text-[11px] text-neutral-500 font-mono">
            🖱 Arrastra los bloques de texto/imagen directamente en el canvas
          </div>
        )}

        {SECTIONS.map(section => (
          <div
            key={section.id}
            id={`canvas-${section.id}`}
            onClick={() => setActiveSectionId(section.id)}
          >
            <SectionCanvas
              sectionId={section.id}
              nasaData={nasa}
              isActive={activeSectionId === section.id}
              bgImage={nasa[`${section.id}BgImage`] || ''}  
              onElementDrag={handleElementDrag}
              onElementSelect={setSelectedElId}
              selectedElId={selectedElId}
            />
          </div>
        ))}
      </div>

      {/* ── PANEL DERECHO (Inspector) ── */}
      <div className="w-80 border-l border-neutral-800 bg-neutral-900/80 backdrop-blur flex flex-col z-50 shrink-0">

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 shrink-0">
          <button
            onClick={() => setRightTab('content')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors
              ${rightTab === 'content' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Contenido
          </button>
          <button
            onClick={() => setRightTab('elements')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors
              ${rightTab === 'elements' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Elementos ({(nasa.freeElements || []).length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {!canEdit ? (
            <p className="text-neutral-500 text-center text-sm p-4 border border-dashed border-neutral-700 rounded">
              Solo el administrador puede editar el código de esta web.
            </p>
          ) : rightTab === 'content' ? (
            /* ── TAB CONTENIDO ── */
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <h4 className="text-[10px] text-blue-400 font-bold uppercase">🚀 Portada (Sección 1)</h4>
                <label className="text-[10px] text-neutral-500">Fondo — URL de imagen</label>
                <input type="text" placeholder="https://imagen-espacial.jpg"
                  value={nasa.heroBgImage || ''}
                  onChange={e => updateNasaData({ heroBgImage: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-neutral-500 whitespace-nowrap">Altura: {nasa.heroHeight || 100}vh</label>
                  <input type="range" min="60" max="300" step="10"
                    value={nasa.heroHeight || 100}
                    onChange={e => updateNasaData({ heroHeight: Number(e.target.value) })}
                    className="w-full accent-cyan-500" />
                </div>
                <input type="text" value={nasa.heroTitle || ''} onChange={e => updateNasaData({ heroTitle: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-sm font-bold" placeholder="Título Principal" />
                <textarea rows={2} value={nasa.heroSubtitle || ''} onChange={e => updateNasaData({ heroSubtitle: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" placeholder="Subtítulo" />
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] text-emerald-400 font-bold uppercase">📄 Misión (Sección 2)</h4>
                <label className="text-[10px] text-neutral-500">Fondo — URL de imagen</label>
                <input type="text" placeholder="https://imagen-oceano.jpg"
                  value={nasa.aboutBgImage || ''}
                  onChange={e => updateNasaData({ aboutBgImage: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-neutral-500 whitespace-nowrap">Altura: {nasa.aboutHeight || 100}vh</label>
                  <input type="range" min="60" max="300" step="10"
                    value={nasa.aboutHeight || 100}
                    onChange={e => updateNasaData({ aboutHeight: Number(e.target.value) })}
                    className="w-full accent-emerald-500" />
                </div>
                <input type="text" value={nasa.aboutHeading || ''} onChange={e => updateNasaData({ aboutHeading: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-sm font-bold" placeholder="Encabezado" />
                <textarea rows={4} value={nasa.aboutText || ''} onChange={e => updateNasaData({ aboutText: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" placeholder="Descripción de misión..." />
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] text-orange-400 font-bold uppercase">📊 Stats (Sección 3)</h4>
                <label className="text-[10px] text-neutral-500">Fondo — URL de imagen</label>
                <input type="text" placeholder="https://imagen-fauna.jpg"
                  value={nasa.statsBgImage || ''}
                  onChange={e => updateNasaData({ statsBgImage: e.target.value })}
                  className="bg-black border border-neutral-700 rounded p-2 text-white w-full text-xs" />
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-neutral-500 whitespace-nowrap">Altura: {nasa.statsHeight || 100}vh</label>
                  <input type="range" min="60" max="300" step="10"
                    value={nasa.statsHeight || 100}
                    onChange={e => updateNasaData({ statsHeight: Number(e.target.value) })}
                    className="w-full accent-orange-500" />
                </div>
                {(nasa.features || []).map((feat, idx) => (
                  <div key={idx} className="p-3 bg-black border border-neutral-800 rounded space-y-1">
                    <input placeholder="Valor grande (ej: 1500 km)" value={feat.val || ''}
                      onChange={e => updateFeature(idx, 'val', e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded p-1 text-white w-full text-xs font-black" />
                    <input placeholder="Título" value={feat.title || ''}
                      onChange={e => updateFeature(idx, 'title', e.target.value)}
                      className="bg-transparent text-cyan-400 w-full text-xs font-bold outline-none" />
                    <input placeholder="Descripción..." value={feat.desc || ''}
                      onChange={e => updateFeature(idx, 'desc', e.target.value)}
                      className="bg-transparent text-neutral-500 w-full text-[10px] font-mono outline-none" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── TAB ELEMENTOS LIBRES ── */
            <div className="flex flex-col gap-4">
              <ElementInspector
                element={selectedEl}
                onChange={(newData) => selectedEl && updateFreeElement(selectedEl.id, newData)}
                onDelete={() => selectedEl && deleteFreeElement(selectedEl.id)}
              />

              {/* Lista de todos los elementos */}
              {(nasa.freeElements || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-600 font-mono uppercase">Todos los elementos</p>
                  {(nasa.freeElements || []).map(el => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElId(el.id)}
                      className={`p-2 rounded border cursor-pointer transition-all text-xs
                        ${selectedElId === el.id
                          ? 'border-cyan-500/50 bg-cyan-500/5 text-cyan-300'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:border-neutral-600'}`}
                    >
                      <span className="mr-2">{el.type === 'text' ? '📝' : '🖼️'}</span>
                      <span className="font-mono text-neutral-500">{el.sectionId}</span>
                      {' — '}
                      <span className="truncate">{el.type === 'text' ? (el.content || '').slice(0, 20) : (el.src || 'imagen').slice(0, 20)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
