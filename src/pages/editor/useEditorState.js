/**
 * useEditorState.js — Hook maestro del Editor
 *
 * Toda la lógica de estado del editor vive aquí:
 * carga, guardado, secciones, elementos, undo, image search, paneles móviles.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

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

// ── Default element data ─────────────────────────────────────────────────────
const ELEMENT_DEFAULTS = {
  text:       { content: 'Nuevo texto', x: 10, y: 10, w: 55, h: 15, style: { fontSize: 36, color: '#ffffff', fontWeight: '700' } },
  image:      { src: '', x: 20, y: 15, w: 40, h: 35, style: { opacity: 1, borderRadius: 0 } },
  metric:     { val: '100', title: 'TÍTULO', desc: 'Descripción', x: 10, y: 15, w: 28, h: 55, style: { fontSize: 64 } },
  timeline:   { title: 'Línea del Tiempo', items: [
                { year: '2020', title: 'Evento 1', desc: 'Descripción del evento' },
                { year: '2022', title: 'Evento 2', desc: 'Descripción del evento' },
                { year: '2024', title: 'Evento 3', desc: 'Descripción del evento' },
              ], x: 5, y: 8, w: 40, h: 80, style: { color: '#22d3ee' } },
  comparison: { columns: [
                { title: 'Opción A', items: ['Ventaja 1', 'Ventaja 2', 'Ventaja 3'], color: '#22d3ee' },
                { title: 'Opción B', items: ['Ventaja 1', 'Ventaja 2', 'Ventaja 3'], color: '#a78bfa' },
              ], x: 5, y: 10, w: 55, h: 75, style: {} },
  formula:    { content: 'E = mc^2', label: 'Ecuación de Einstein', x: 10, y: 30, w: 50, h: 30, style: { fontSize: 36, color: '#ffffff' } },
  code:       { content: '# Tu código aquí\nprint("Hola mundo")', language: 'python', x: 8, y: 10, w: 50, h: 50, style: { fontSize: 14 } },
  bento:      { items: [
                { title: 'Feature 1', desc: 'Descripción', icon: '🚀', size: 'large' },
                { title: 'Feature 2', desc: 'Descripción', icon: '⚡', size: 'small' },
                { title: 'Feature 3', desc: 'Descripción', icon: '🔒', size: 'small' },
                { title: 'Feature 4', desc: 'Descripción', icon: '📊', size: 'small' },
              ], x: 3, y: 5, w: 60, h: 85, style: {} },
  counter:    { val: '300', suffix: '+', title: 'USUARIOS', desc: 'registrados este año', x: 15, y: 20, w: 30, h: 55, style: { fontSize: 96 } },
  blockquote: { content: 'La única forma de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs', x: 10, y: 20, w: 60, h: 50, style: { fontSize: 28, color: '#ffffff' } },
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export default function useEditorState() {
  const { slug: identifier } = useParams();
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
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageSearchTarget, setImageSearchTarget] = useState(null); // 'bg' | elementId
  const [imageSearchInitialQuery, setImageSearchInitialQuery] = useState('');

  // Responsive mobile states
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // ── Undo/Redo history ──────────────────────────────────────────────────
  const MAX_HISTORY = 30;
  const history = useRef([]);     // past snapshots
  const future = useRef([]);      // redo snapshots
  const isUndoRedo = useRef(false);
  const clipboard = useRef(null); // for Ctrl+C/V

  const canvasRef  = useRef(null);
  const saveTimer  = useRef(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Sync the undo/redo button states after any history mutation */
  const syncHistoryFlags = useCallback(() => {
    setCanUndo(history.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  /** Push a snapshot to the undo history before making changes */
  const pushHistory = useCallback(() => {
    history.current = [{ sections: JSON.parse(JSON.stringify(sections)), activeSectionId, selectedElId }, ...history.current].slice(0, MAX_HISTORY);
    future.current = []; // clear redo stack when new action is taken
    syncHistoryFlags();
  }, [sections, activeSectionId, selectedElId, syncHistoryFlags]);

  // ── Load ────────────────────────────────────────────────────────────────────
  const hasLoadedId = useRef(null);

  useEffect(() => {
    // Only load from DB if we haven't loaded THIS specific presentation yet
    if (hasLoadedId.current === identifier) return;

    const load = async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let data, error;

      if (isUUID) {
        // Fallback for old links: Fetch by ID
        const res = await supabase.from('presentations').select('*').eq('id', identifier).single();
        data = res.data; error = res.error;
        
        // Smart Redirect to the new slug URL
        if (!error && data && data.slug) {
          navigate(`/editor/${data.slug}`, { replace: true });
          return;
        }
      } else {
        // Fetch by Slug (New Default)
        const res = await supabase.from('presentations').select('*').eq('slug', identifier).single();
        data = res.data; error = res.error;
      }

      if (error || !data) { alert('No encontrado'); navigate('/'); return; }
      
      const isOwner  = data.user_id === user?.id;
      const isEditor = Array.isArray(data.editors_emails) && data.editors_emails.includes(user?.email);
      setCanEdit(isOwner || isEditor);
      setPresentation(data);
      
      const secs = migrateToSections(data.slides_data);
      setSections(secs);
      setActiveSectionId(secs[0]?.id || null);
      setLoading(false);
      hasLoadedId.current = identifier;
    };
    
    if (user?.id) {
      load();
    }
  }, [identifier, user?.id, user?.email, navigate]);

  // ── Debounced save ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty || !canEdit) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!presentation?.id) return;
      setSaveStatus('saving');
      await supabase.from('presentations').update({ slides_data: { sections } }).eq('id', presentation.id);
      setSaveStatus('saved');
      setIsDirty(false);
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [sections, isDirty, presentation, canEdit]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const markDirty = () => {
    setIsDirty(true);
    setSaveStatus('dirty');
  };
  const activeSection = sections.find(s => s.id === activeSectionId);
  const selectedEl    = activeSection?.elements?.find(e => e.id === selectedElId);

  // ── Element actions ──────────────────────────────────────────────────────────
  const updateElement = useCallback((elId, changes) => {
    if (!isUndoRedo.current) pushHistory();
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : {
        ...sec,
        elements: sec.elements.map(e => e.id === elId ? { ...e, ...changes } : e),
      }
    ));
    markDirty();
  }, [activeSectionId, pushHistory]);

  const deleteElement = useCallback((elId) => {
    pushHistory();
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: sec.elements.filter(e => e.id !== elId) }
    ));
    setSelectedElId(null);
    markDirty();
  }, [activeSectionId, pushHistory]);

  const duplicateElement = useCallback(() => {
    if (!selectedEl) return;
    pushHistory();
    const newEl = { ...JSON.parse(JSON.stringify(selectedEl)), id: uid(), x: selectedEl.x + 3, y: selectedEl.y + 3 };
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: [...sec.elements, newEl] }
    ));
    setSelectedElId(newEl.id);
    markDirty();
  }, [selectedEl, activeSectionId, pushHistory]);

  const addElement = useCallback((type) => {
    pushHistory();
    const newEl = { id: uid(), type, ...ELEMENT_DEFAULTS[type] };
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: [...sec.elements, newEl] }
    ));
    setSelectedElId(newEl.id);
    setRightTab('element');
    markDirty();
  }, [activeSectionId, pushHistory]);

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
    pushHistory();
    setSections(newSections);
    setActiveSectionId(newSections[0]?.id || null);
    setSelectedElId(null);
    markDirty();
  }, [pushHistory]);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (!history.current.length) return false;
    // Save current state to future (redo)
    future.current = [{ sections: JSON.parse(JSON.stringify(sections)), activeSectionId, selectedElId }, ...future.current].slice(0, MAX_HISTORY);
    const last = history.current.shift();
    isUndoRedo.current = true;
    setSections(last.sections);
    setActiveSectionId(last.activeSectionId);
    setSelectedElId(last.selectedElId || null);
    markDirty();
    isUndoRedo.current = false;
    syncHistoryFlags();
    return true;
  }, [sections, activeSectionId, selectedElId, syncHistoryFlags]);

  const redo = useCallback(() => {
    if (!future.current.length) return false;
    // Save current state to history
    history.current = [{ sections: JSON.parse(JSON.stringify(sections)), activeSectionId, selectedElId }, ...history.current].slice(0, MAX_HISTORY);
    const next = future.current.shift();
    isUndoRedo.current = true;
    setSections(next.sections);
    setActiveSectionId(next.activeSectionId);
    setSelectedElId(next.selectedElId || null);
    markDirty();
    isUndoRedo.current = false;
    syncHistoryFlags();
    return true;
  }, [sections, activeSectionId, selectedElId, syncHistoryFlags]);

  // Backwards-compatible alias
  const undoAiChange = undo;

  // ── Copy / Paste ────────────────────────────────────────────────────────────
  const copyElement = useCallback(() => {
    if (!selectedEl) return;
    clipboard.current = JSON.parse(JSON.stringify(selectedEl));
  }, [selectedEl]);

  const pasteElement = useCallback(() => {
    if (!clipboard.current) return;
    pushHistory();
    const newEl = { ...clipboard.current, id: uid(), x: clipboard.current.x + 3, y: clipboard.current.y + 3 };
    setSections(prev => prev.map(sec =>
      sec.id !== activeSectionId ? sec : { ...sec, elements: [...sec.elements, newEl] }
    ));
    setSelectedElId(newEl.id);
    markDirty();
  }, [activeSectionId, pushHistory]);



  // ── Move element layer (z-index via array order) ────────────────────────────
  const moveElementLayer = useCallback((direction) => {
    if (!selectedElId || !activeSectionId) return;
    pushHistory();
    setSections(prev => prev.map(sec => {
      if (sec.id !== activeSectionId) return sec;
      const els = [...sec.elements];
      const idx = els.findIndex(e => e.id === selectedElId);
      if (idx === -1) return sec;
      if (direction === 'up' && idx < els.length - 1) {
        [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
      } else if (direction === 'down' && idx > 0) {
        [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
      } else if (direction === 'top') {
        els.push(els.splice(idx, 1)[0]);
      } else if (direction === 'bottom') {
        els.unshift(els.splice(idx, 1)[0]);
      }
      return { ...sec, elements: els };
    }));
    markDirty();
  }, [selectedElId, activeSectionId, pushHistory]);

  useEffect(() => {
    const handler = (e) => {
      // Don't intercept when typing in inputs/textareas/contenteditable
      const tag = e.target.tagName;
      const isEditable = e.target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+D — Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isEditable) {
        e.preventDefault();
        duplicateElement();
        return;
      }

      // Ctrl+C — Copy element
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isEditable && selectedElId) {
        e.preventDefault();
        copyElement();
        return;
      }

      // Ctrl+V — Paste element
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isEditable) {
        e.preventDefault();
        pasteElement();
        return;
      }

      // Skip the rest if we're in an editable field
      if (isEditable) return;

      // Delete / Backspace — Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElId) {
        e.preventDefault();
        deleteElement(selectedElId);
        return;
      }

      // Arrow keys — Nudge selected element (1% or 0.25% with Shift)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElId) {
        e.preventDefault();
        const step = e.shiftKey ? 0.25 : 1;
        const nudge = {};
        if (e.key === 'ArrowUp')    nudge.y = -step;
        if (e.key === 'ArrowDown')  nudge.y = step;
        if (e.key === 'ArrowLeft')  nudge.x = -step;
        if (e.key === 'ArrowRight') nudge.x = step;
        updateElement(selectedElId, {
          x: Math.max(0, Math.min(95, (activeSection?.elements?.find(el => el.id === selectedElId)?.x ?? 0) + (nudge.x || 0))),
          y: Math.max(0, Math.min(95, (activeSection?.elements?.find(el => el.id === selectedElId)?.y ?? 0) + (nudge.y || 0))),
        });
        return;
      }

      // Escape — Deselect
      if (e.key === 'Escape') {
        setSelectedElId(null);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, duplicateElement, deleteElement, copyElement, pasteElement, selectedElId, updateElement, activeSection]);

  // ── Auto-switch right tab when element selected ──────────────────────────────
  const handleSelectEl = (elId) => {
    setSelectedElId(elId);
    if (elId) setRightTab('element');
  };

  // ── Image search helpers ────────────────────────────────────────────────────
  const openImageSearchForElement = useCallback((query) => {
    if (selectedEl) {
      setImageSearchTarget(selectedEl.id);
      setImageSearchInitialQuery(query || '');
      setImageSearchOpen(true);
    }
  }, [selectedEl]);

  const openImageSearchForBg = useCallback((query) => {
    setImageSearchTarget('bg');
    setImageSearchInitialQuery(query || '');
    setImageSearchOpen(true);
  }, []);

  const handleImageSelect = useCallback((url, photoDetails) => {
    if (imageSearchTarget === 'bg') {
      updateSection({ bgImage: url, ...(photoDetails && { unsplashCredit: photoDetails }) });
    } else if (imageSearchTarget) {
      updateElement(imageSearchTarget, { src: url, ...(photoDetails && { unsplashCredit: photoDetails }) });
    }
    setImageSearchOpen(false);
  }, [imageSearchTarget, updateSection, updateElement]);

  return {
    // Identifiers
    identifier,
    navigate,
    user,

    // Data
    sections,
    presentation,
    loading,
    canEdit,

    // Active/selected
    activeSectionId,
    setActiveSectionId,
    selectedElId,
    setSelectedElId,
    activeSection,
    selectedEl,

    // Right panel
    rightTab,
    setRightTab,

    // Save
    saveStatus,
    isDirty,

    // Image search
    imageSearchOpen,
    setImageSearchOpen,
    imageSearchInitialQuery,
    openImageSearchForElement,
    openImageSearchForBg,
    handleImageSelect,

    // Mobile panels
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    isRightPanelOpen,
    setIsRightPanelOpen,

    // Refs
    canvasRef,

    // Actions: elements
    updateElement,
    deleteElement,
    duplicateElement,
    addElement,
    handleSelectEl,
    copyElement,
    pasteElement,
    moveElementLayer,

    // Actions: sections
    addSection,
    deleteSection,
    updateSection,

    // Actions: AI
    handleAiApply,
    undoAiChange,

    // Actions: history
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
