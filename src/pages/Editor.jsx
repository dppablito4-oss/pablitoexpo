import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import CanvasElement from '../components/CanvasElement';
import AiImportPanel from '../components/AiImportPanel';
import AiCopilotPanel from '../components/AiCopilotPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

/** Converts old nasa {} format → new sections [] format */
function migrateToSections(slidesData) {
  if (slidesData?.sections) return slidesData.sections;
  const n = slidesData?.nasa || {};
  return [
    {
      id: `sec-${uid()}`,
      bgImage: n.heroBgImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072',
      height: n.heroHeight || 100,
      elements: [
        { id: uid(), type: 'text', content: n.heroTitle || 'TÍTULO PRINCIPAL',
          x: 5, y: 28, w: 90, h: 22,
          style: { fontSize: 72, fontWeight: '900', color: '#ffffff', textAlign: 'center', textTransform: 'uppercase' } },
        { id: uid(), type: 'text', content: n.heroSubtitle || 'Subtítulo de la presentación.',
          x: 15, y: 56, w: 70, h: 12,
          style: { fontSize: 22, fontWeight: '300', color: '#bbbbbb', textAlign: 'left' } },
      ],
    },
    {
      id: `sec-${uid()}`,
      bgImage: n.aboutBgImage || '',
      height: n.aboutHeight || 100,
      elements: [
        { id: uid(), type: 'text', content: n.aboutHeading || 'Misión Principal',
          x: 5, y: 20, w: 44, h: 20,
          style: { fontSize: 48, fontWeight: '700', color: '#ffffff' } },
        { id: uid(), type: 'text', content: n.aboutText || 'Descripción de la misión.',
          x: 52, y: 22, w: 43, h: 55,
          style: { fontSize: 18, fontWeight: '300', color: '#cccccc' } },
      ],
    },
    {
      id: `sec-${uid()}`,
      bgImage: n.statsBgImage || '',
      height: n.statsHeight || 100,
      elements: (n.features || [
        { val: '100%', title: 'DATO 1', desc: 'Descripción' },
        { val: '+24h', title: 'DATO 2', desc: 'Descripción' },
        { val: 'MAX',  title: 'DATO 3', desc: 'Descripción' },
      ]).map((f, i) => ({
        id: uid(), type: 'metric',
        val: f.val, title: f.title, desc: f.desc,
        x: 3 + i * 32, y: 20, w: 30, h: 55,
        style: { fontSize: 72 },
      })),
    },
  ];
}

// ── Element Inspector ─────────────────────────────────────────────────────────
function ElementInspector({ el, onUpdate, onDuplicate }) {
  if (!el) return (
    <div className="p-4 text-center text-neutral-600 text-xs py-10">
      Selecciona un elemento en<br />el canvas para editar
    </div>
  );

  const s = el.style || {};
  const upd = (changes) => onUpdate({ style: { ...s, ...changes } });

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          {el.type === 'text' ? '📝 Texto' : el.type === 'image' ? '🖼️ Imagen' : '📊 Métrica'}
        </span>
        <button onClick={onDuplicate}
          className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-white">
          Duplicar
        </button>
      </div>

      {/* TEXT controls */}
      {el.type === 'text' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Contenido</label>
          <textarea rows={3} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs resize-none focus:outline-none focus:border-cyan-700" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500">Tamaño (px)</label>
              <input type="number" min="8" max="220" value={s.fontSize || 28}
                onChange={e => upd({ fontSize: +e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">Color</label>
              <input type="color" value={s.color || '#ffffff'}
                onChange={e => upd({ color: e.target.value })}
                className="w-full h-8 rounded border border-neutral-700 bg-black cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500">Grosor</label>
              <select value={s.fontWeight || 'normal'}
                onChange={e => upd({ fontWeight: e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-xs focus:outline-none">
                <option value="300">Light</option>
                <option value="normal">Normal</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">Alineación</label>
              <select value={s.textAlign || 'left'}
                onChange={e => upd({ textAlign: e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-xs focus:outline-none">
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500">Mayúsculas</label>
            <select value={s.textTransform || 'none'}
              onChange={e => upd({ textTransform: e.target.value })}
              className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-xs focus:outline-none">
              <option value="none">Normal</option>
              <option value="uppercase">MAYÚSCULAS</option>
              <option value="lowercase">minúsculas</option>
              <option value="capitalize">Primera Letra</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-neutral-500">Opacidad: {(s.opacity ?? 1).toFixed(2)}</label>
            <input type="range" min="0.05" max="1" step="0.05" value={s.opacity ?? 1}
              onChange={e => upd({ opacity: +e.target.value })}
              className="w-full accent-cyan-500" />
          </div>
        </div>
      )}

      {/* IMAGE controls */}
      {el.type === 'image' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">URL de imagen</label>
          <input type="text" value={el.src || ''} placeholder="https://..."
            onChange={e => onUpdate({ src: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs focus:outline-none focus:border-cyan-700" />
          <label className="text-[10px] text-neutral-500">Borde redondeado: {s.borderRadius || 0}px</label>
          <input type="range" min="0" max="50" value={s.borderRadius || 0}
            onChange={e => upd({ borderRadius: +e.target.value })}
            className="w-full accent-cyan-500" />
          <label className="text-[10px] text-neutral-500">Opacidad: {(s.opacity ?? 1).toFixed(2)}</label>
          <input type="range" min="0.05" max="1" step="0.05" value={s.opacity ?? 1}
            onChange={e => upd({ opacity: +e.target.value })}
            className="w-full accent-cyan-500" />
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={!!s.shadow} onChange={e => upd({ shadow: e.target.checked })} />
            Sombra dramática
          </label>
        </div>
      )}

      {/* METRIC controls */}
      {el.type === 'metric' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Valor grande</label>
          <input type="text" value={el.val || ''}
            onChange={e => onUpdate({ val: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xl font-black focus:outline-none" />
          <label className="text-[10px] text-neutral-500">Título cyan</label>
          <input type="text" value={el.title || ''}
            onChange={e => onUpdate({ title: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-cyan-400 text-xs font-bold focus:outline-none" />
          <label className="text-[10px] text-neutral-500">Descripción</label>
          <input type="text" value={el.desc || ''}
            onChange={e => onUpdate({ desc: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-neutral-500 text-xs font-mono focus:outline-none" />
          <label className="text-[10px] text-neutral-500">Tamaño número (px)</label>
          <input type="number" min="24" max="180" value={s.fontSize || 64}
            onChange={e => upd({ fontSize: +e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-sm focus:outline-none" />
        </div>
      )}

      {/* Position & size */}
      <div className="border-t border-neutral-800 pt-3">
        <label className="text-[10px] text-neutral-600 uppercase tracking-widest">Posición & tamaño (%)</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {['x','y','w','h'].map(prop => (
            <div key={prop}>
              <label className="text-[10px] text-neutral-600">{prop.toUpperCase()}</label>
              <input type="number" min="0" max="100" step="0.5" value={el[prop] ?? 0}
                onChange={e => onUpdate({ [prop]: +e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-sm focus:outline-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Inspector ─────────────────────────────────────────────────────────
function SectionInspector({ section, onUpdate }) {
  if (!section) return null;
  return (
    <div className="flex flex-col gap-3 p-4">
      <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">⚙️ Sección</h4>
      <label className="text-[10px] text-neutral-500">Fondo (URL de imagen)</label>
      <input type="text" value={section.bgImage || ''} placeholder="https://..."
        onChange={e => onUpdate({ bgImage: e.target.value })}
        className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs focus:outline-none focus:border-emerald-700" />
      <label className="text-[10px] text-neutral-500">Altura: {section.height || 100}vh</label>
      <input type="range" min="60" max="300" step="10" value={section.height || 100}
        onChange={e => onUpdate({ height: +e.target.value })}
        className="w-full accent-emerald-500" />
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────
export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sections, setSections] = useState([]);
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  const [activeSectionId, setActiveSectionId] = useState(null);
  const [selectedElId, setSelectedElId]       = useState(null);
  const [rightTab, setRightTab]               = useState('section'); // 'section' | 'element' | 'copilot'

  const [isDirty, setIsDirty]       = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved'|'saving'|'dirty'

  // ── Undo stack (for AI changes) ────────────────────────────────────────
  const undoStack = useRef([]); // up to 10 snapshots

  const canvasRef  = useRef(null);
  const saveTimer  = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('presentations').select('*').eq('id', id).single();
      if (error) { alert('No encontrado'); navigate('/'); return; }
      const isOwner  = data.user_id === user?.id;
      const isEditor = Array.isArray(data.editors_emails) && data.editors_emails.includes(user?.email);
      setCanEdit(isOwner || isEditor);
      setPresentation(data);
      const secs = migrateToSections(data.slides_data);
      setSections(secs);
      setActiveSectionId(secs[0]?.id || null);
      setLoading(false);
    };
    load();
  }, [id, user, navigate]);

  // ── Debounced save ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty || !canEdit) return;
    setSaveStatus('dirty');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      await supabase.from('presentations').update({ slides_data: { sections } }).eq('id', id);
      setSaveStatus('saved');
      setIsDirty(false);
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [sections, isDirty, id, canEdit]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const markDirty = () => setIsDirty(true);
  const activeSection = sections.find(s => s.id === activeSectionId);
  const selectedEl    = activeSection?.elements?.find(e => e.id === selectedElId);

  // ── Element actions ──────────────────────────────────────────────────────────
  const updateElement = useCallback((elId, changes) => {
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : {
        ...sec,
        elements: sec.elements.map(e => e.id === elId ? { ...e, ...changes } : e),
      }
    ));
    markDirty();
  }, [activeSectionId]);

  const deleteElement = useCallback((elId) => {
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: sec.elements.filter(e => e.id !== elId) }
    ));
    setSelectedElId(null);
    markDirty();
  }, [activeSectionId]);

  const duplicateElement = useCallback(() => {
    if (!selectedEl) return;
    const newEl = { ...selectedEl, id: uid(), x: selectedEl.x + 3, y: selectedEl.y + 3 };
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: [...sec.elements, newEl] }
    ));
    setSelectedElId(newEl.id);
    markDirty();
  }, [selectedEl, activeSectionId]);

  const addElement = useCallback((type) => {
    const defaults = {
      text:   { content: 'Nuevo texto', x: 10, y: 10, w: 55, h: 15, style: { fontSize: 36, color: '#ffffff', fontWeight: '700' } },
      image:  { src: '', x: 20, y: 15, w: 40, h: 35, style: { opacity: 1, borderRadius: 0 } },
      metric: { val: '100', title: 'TÍTULO', desc: 'Descripción', x: 10, y: 15, w: 28, h: 55, style: { fontSize: 64 } },
    };
    const newEl = { id: uid(), type, ...defaults[type] };
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: [...sec.elements, newEl] }
    ));
    setSelectedElId(newEl.id);
    setRightTab('element');
    markDirty();
  }, [activeSectionId]);

  // ── Section actions ──────────────────────────────────────────────────────────
  const addSection = useCallback(() => {
    const newSec = {
      id: `sec-${uid()}`, bgImage: '', height: 100,
      elements: [
        { id: uid(), type: 'text', content: 'Nueva sección',
          x: 10, y: 35, w: 80, h: 20,
          style: { fontSize: 56, fontWeight: '900', color: '#ffffff', textAlign: 'center' } },
      ],
    };
    setSections(prev => [...prev, newSec]);
    setActiveSectionId(newSec.id);
    setSelectedElId(null);
    markDirty();
  }, []);

  const deleteSection = useCallback((secId) => {
    if (sections.length <= 1) return;
    const next = sections.filter(s => s.id !== secId);
    setSections(next);
    setActiveSectionId(next[0]?.id || null);
    markDirty();
  }, [sections]);

  const updateSection = useCallback((changes) => {
    setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, ...changes } : s));
    markDirty();
  }, [activeSectionId]);

  // ── AI import apply ──────────────────────────────────────────────────────────
  const handleAiApply = useCallback((data) => {
    let newSections;
    if (data.sections) {
      newSections = data.sections;
    } else {
      newSections = migrateToSections({ nasa: data });
    }
    // Save snapshot for undo BEFORE applying
    undoStack.current = [{ sections: sections.map(s => ({...s})), activeSectionId }, ...undoStack.current].slice(0, 10);
    setSections(newSections);
    setActiveSectionId(newSections[0]?.id || null);
    setSelectedElId(null);
    markDirty();
  }, [sections, activeSectionId]);

  // ── Undo last AI change ───────────────────────────────────────────────────────
  const undoAiChange = useCallback(() => {
    if (!undoStack.current.length) return false;
    const last = undoStack.current.shift();
    setSections(last.sections);
    setActiveSectionId(last.activeSectionId);
    setSelectedElId(null);
    markDirty();
    return true;
  }, []);

  // ── Auto-switch right tab when element selected ──────────────────────────────
  const handleSelectEl = (elId) => {
    setSelectedElId(elId);
    if (elId) setRightTab('element');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-white text-sm font-mono tracking-widest animate-pulse">CARGANDO EDITOR...</div>
    </div>
  );

  const canvasH = Math.max(400, ((activeSection?.height || 100) / 100) * 500);

  return (
    <div className="w-screen h-screen bg-neutral-950 flex flex-col overflow-hidden text-white">

      {/* ── TOP BAR ── */}
      <div className="h-11 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-black/80 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="text-neutral-500 hover:text-white transition-colors text-lg leading-none">←</button>
          <span className="text-xs font-bold text-neutral-300 truncate max-w-[200px]">
            {presentation?.title || 'Editor'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono transition-colors ${
            saveStatus === 'saved'  ? 'text-emerald-500' :
            saveStatus === 'saving' ? 'text-yellow-400 animate-pulse' : 'text-neutral-600'
          }`}>
            {saveStatus === 'saved' ? '✓ guardado' : saveStatus === 'saving' ? '● guardando...' : '○ sin guardar'}
          </span>
          <button
            onClick={() => window.open(`/#/projector/${id}`, '_blank')}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            ▶ Ver Proyector
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Section list ── */}
        <div className="w-40 border-r border-neutral-800 bg-neutral-900/60 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Secciones</span>
            <button onClick={addSection}
              className="text-cyan-400 hover:text-cyan-300 text-xl leading-none font-bold" title="Añadir sección">+</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 hide-scrollbar">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => { setActiveSectionId(sec.id); setSelectedElId(null); setRightTab('section'); }}
                className={`rounded-lg overflow-hidden cursor-pointer border transition-all group relative
                  ${activeSectionId === sec.id
                    ? 'border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                    : 'border-neutral-800 hover:border-neutral-700'}`}
              >
                <div
                  className="h-16 relative bg-cover bg-center"
                  style={{
                    backgroundImage: sec.bgImage ? `url(${sec.bgImage})` : undefined,
                    backgroundColor: !sec.bgImage ? '#111' : undefined,
                  }}
                >
                  {!sec.bgImage && <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white/80 z-10 leading-tight">
                    {idx + 1}. {sec.elements?.[0]?.content?.slice(0, 14) || 'Sección'}
                  </div>
                  {sections.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSection(sec.id); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-900/90 text-white text-[10px]
                                 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                    >×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">

          {/* Toolbar */}
          {canEdit && (
            <div className="h-10 border-b border-neutral-800 flex items-center gap-1.5 px-4 shrink-0 bg-neutral-950/60">
              <span className="text-[9px] text-neutral-600 font-mono uppercase mr-1">Agregar:</span>
              {[
                { type: 'text',   label: '📝 Texto' },
                { type: 'image',  label: '🖼️ Imagen' },
                { type: 'metric', label: '📊 Métrica' },
              ].map(({ type, label }) => (
                <button key={type} onClick={() => addElement(type)}
                  className="px-2.5 py-1 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700
                             text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors">
                  {label}
                </button>
              ))}
              <div className="w-px h-5 bg-neutral-700 mx-1" />
              <button onClick={duplicateElement} disabled={!selectedEl}
                className="px-2.5 py-1 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700
                           text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors
                           disabled:opacity-25 disabled:cursor-not-allowed">
                ⠿ Duplicar
              </button>
              {selectedEl && (
                <span className="ml-auto text-[10px] text-neutral-600">
                  ESC para deseleccionar
                </span>
              )}
            </div>
          )}

          {/* Scrollable canvas area */}
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            {activeSection ? (
              <div className="w-full max-w-5xl">
                <div className="text-[10px] text-neutral-600 font-mono mb-2.5 flex items-center gap-2">
                  <span>SECCIÓN {sections.indexOf(activeSection) + 1} / {sections.length}</span>
                  <span className="text-neutral-700">·</span>
                  <span>{activeSection.height || 100}vh</span>
                  <span className="text-neutral-700">·</span>
                  <span>{activeSection.elements?.length || 0} elementos</span>
                </div>

                {/* The canvas */}
                <div
                  ref={canvasRef}
                  onClick={() => setSelectedElId(null)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setSelectedElId(null); }}
                  tabIndex={-1}
                  style={{
                    width: '100%',
                    height: `${canvasH}px`,
                    position: 'relative',
                    backgroundImage: activeSection.bgImage ? `url(${activeSection.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0a0a0f',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 0 0 1px rgba(34,211,238,0.04), 0 30px 60px rgba(0,0,0,0.8)',
                    outline: 'none',
                  }}
                >
                  {/* dark overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1, pointerEvents: 'none' }} />
                  {/* subtle grid */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                  }} />

                  {/* Elements */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                    {(activeSection.elements || []).map(el =>
                      canEdit ? (
                        <CanvasElement
                          key={el.id}
                          el={el}
                          isSelected={selectedElId === el.id}
                          onSelect={handleSelectEl}
                          onUpdate={updateElement}
                          onDelete={deleteElement}
                          containerRef={canvasRef}
                        />
                      ) : (
                        <div key={el.id} style={{
                          position: 'absolute',
                          left: `${el.x}%`, top: `${el.y}%`,
                          width: `${el.w}%`, height: `${el.h}%`,
                          pointerEvents: 'none',
                        }} />
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-600 py-20 text-sm">
                Selecciona o crea una sección →
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Inspector ── */}
        <div className="w-72 border-l border-neutral-800 bg-neutral-900/80 flex flex-col shrink-0 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-neutral-800 shrink-0">
            <button
              onClick={() => { setRightTab('section'); setSelectedElId(null); }}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors
                ${rightTab === 'section' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/20' : 'text-neutral-500 hover:text-neutral-300'}`}>
              Sección
            </button>
            <button
              onClick={() => setRightTab('element')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors
                ${rightTab === 'element' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20' : 'text-neutral-500 hover:text-neutral-300'}`}>
              Elemento
            </button>
            <button
              onClick={() => { setRightTab('copilot'); setSelectedElId(null); }}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors
                ${rightTab === 'copilot' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400 bg-fuchsia-950/20' : 'text-neutral-500 hover:text-neutral-300'}`}>
              🤖 Copiloto
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
            {/* Always render all tabs but hide inactive ones with CSS - preserves state */}
            <div style={{ display: rightTab === 'copilot' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
              <AiCopilotPanel
                currentSections={sections}
                onApplyChanges={handleAiApply}
                onUndo={undoAiChange}
                canUndo={undoStack.current.length > 0}
              />
            </div>
            <div style={{ display: rightTab === 'element' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
              <ElementInspector
                el={selectedEl}
                onUpdate={(changes) => selectedEl && updateElement(selectedEl.id, changes)}
                onDuplicate={duplicateElement}
              />
            </div>
            <div style={{ display: rightTab === 'section' ? 'flex' : 'none', flexDirection: 'column' }}>
              <SectionInspector section={activeSection} onUpdate={updateSection} />
              <div className="border-t border-neutral-800 p-4 mt-auto">
                <AiImportPanel onApply={handleAiApply} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
