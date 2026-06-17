/**
 * Editor.jsx — Orquestador principal del editor de presentaciones.
 *
 * La lógica de estado vive en useEditorState.
 * Los inspectores, toolbar y demás viven en src/pages/editor/.
 */
import CanvasElement from '../components/CanvasElement';
import AiImportPanel from '../components/AiImportPanel';
import AiCopilotPanel from '../components/AiCopilotPanel';
import ImageSearchModal from '../components/ImageSearchModal';
import UnsplashBadge from '../components/UnsplashBadge';
import { Menu, X } from 'lucide-react';

import useEditorState from './editor/useEditorState';
import ElementInspector from './editor/ElementInspector';
import SectionInspector from './editor/SectionInspector';
import EditorToolbar from './editor/EditorToolbar';

export default function Editor() {
  const state = useEditorState();

  const {
    identifier, navigate,
    sections, presentation, loading, canEdit,
    activeSectionId, setActiveSectionId,
    selectedElId, setSelectedElId,
    activeSection, selectedEl,
    rightTab, setRightTab,
    saveStatus,
    imageSearchOpen, setImageSearchOpen, imageSearchInitialQuery,
    openImageSearchForElement, openImageSearchForBg, handleImageSelect,
    isLeftPanelOpen, setIsLeftPanelOpen,
    canvasRef,
    updateElement, deleteElement, duplicateElement, addElement, handleSelectEl,
    moveElementLayer,
    addSection, deleteSection, updateSection,
    handleAiApply,
    undo, redo, canUndo, canRedo,
  } = state;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-white text-sm font-mono tracking-widest animate-pulse">CARGANDO EDITOR...</div>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-neutral-950 flex flex-col overflow-hidden text-white">

      {/* ── TOP BAR (Desktop) ── */}
      <div className="hidden md:flex h-11 border-b border-neutral-800 items-center justify-between px-4 shrink-0 bg-black/80 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="text-neutral-500 hover:text-white transition-colors text-lg leading-none">←</button>
          <span className="text-xs font-bold text-neutral-300 truncate max-w-[200px]">
            {presentation?.title || 'Editor'}
          </span>
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 ml-2 border-l border-neutral-800 pl-3">
            <button onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
              className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all ${canUndo ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'}`}>
              ↩
            </button>
            <button onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)"
              className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all ${canRedo ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'}`}>
              ↪
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-mono transition-colors ${
            saveStatus === 'saved'  ? 'text-emerald-500' :
            saveStatus === 'saving' ? 'text-yellow-400 animate-pulse' : 'text-neutral-600'
          }`}>
            {saveStatus === 'saved' ? '✓ guardado' : saveStatus === 'saving' ? '● guardando...' : '○ sin guardar'}
          </span>
          <button
            onClick={() => window.open(`/#/projector/${identifier}`, '_blank')}
            className="px-3 py-2 md:py-1 rounded-lg text-xs md:text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
            ▶ Ver Proyector
          </button>
        </div>
      </div>

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden h-14 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 bg-black/90 z-40">
        <button onClick={() => setIsLeftPanelOpen(true)} className="p-2 text-neutral-400 hover:text-white bg-neutral-900 rounded-lg">
          <Menu size={20} />
        </button>
        <span className="text-sm font-bold text-neutral-200 truncate mx-2">
          {presentation?.title || 'Editor'}
        </span>
        <div className="w-9" /> {/* Spacer para centrar el título */}
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">

        {/* ── MOBILE OVERLAY (Solo para Drawer Izquierdo) ── */}
        {isLeftPanelOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsLeftPanelOpen(false)}
          />
        )}

        {/* ── LEFT: Section list ── */}
        <div className={`
          fixed md:static inset-y-0 left-0 w-72 md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 z-50
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="md:hidden" onClick={() => setIsLeftPanelOpen(false)}><X size={16} className="text-neutral-500" /></button>
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Diapositivas</span>
            </div>
            <button onClick={addSection}
              className="text-cyan-400 bg-cyan-950/30 w-7 h-7 rounded-md hover:bg-cyan-900/50 hover:text-cyan-300 flex items-center justify-center text-lg font-bold transition-colors" title="Añadir sección">+</button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
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
        <div className="flex-none h-[40vh] md:h-auto md:flex-1 flex flex-col overflow-hidden bg-zinc-950">

          {/* Toolbar */}
          <EditorToolbar
            canEdit={canEdit}
            addElement={addElement}
            duplicateElement={duplicateElement}
            selectedEl={selectedEl}
          />

          {/* Scrollable canvas area */}
          <div className="order-1 md:order-2 flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 flex items-center justify-center bg-black/50">
            {activeSection ? (
              <div className="w-full max-w-5xl flex flex-col items-center">

                <div className="text-[10px] text-neutral-600 font-mono mb-2.5 flex items-center gap-2">
                  <span>SECCIÓN {sections.indexOf(activeSection) + 1} / {sections.length}</span>
                  <span className="text-neutral-700">·</span>
                  <span>{activeSection.height || 100}vh</span>
                  <span className="text-neutral-700">·</span>
                  <span>{activeSection.elements?.length || 0} elementos</span>
                </div>

                {/* The canvas */}
                <div
                  className="w-full relative overflow-hidden rounded-xl border border-zinc-800 shadow-2xl focus:outline-none"
                  ref={canvasRef}
                  onClick={() => setSelectedElId(null)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setSelectedElId(null); }}
                  tabIndex={-1}
                  style={{
                    aspectRatio: `16 / ${9 * ((activeSection?.height || 100) / 100)}`,
                    backgroundImage: activeSection.bgImage ? `url(${activeSection.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0a0a0f',
                    containerType: 'inline-size',
                  }}
                >

                  {/* dark overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${activeSection?.overlayOpacity ?? 0.35})`, zIndex: 1, pointerEvents: 'none' }} />
                  {/* subtle grid */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                  }} />

                  {/* Copyright Attribution Overlay */}
                  <UnsplashBadge credit={activeSection?.unsplashCredit} />

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
        <div className="flex-1 md:flex-none md:w-[320px] bg-zinc-900 border-t md:border-l border-zinc-800 flex flex-col shrink-0 z-10 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 shrink-0">
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

          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
            {/* Always render all tabs but hide inactive ones with CSS - preserves state */}

            <div style={{ display: rightTab === 'copilot' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
              <AiCopilotPanel currentSections={sections} />
            </div>
            <div style={{ display: rightTab === 'element' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
              <ElementInspector
                el={selectedEl}
                onUpdate={(changes) => selectedEl && updateElement(selectedEl.id, changes)}
                onDuplicate={duplicateElement}
                onOpenImageSearch={openImageSearchForElement}
                onMoveLayer={moveElementLayer}
              />
            </div>
            <div style={{ display: rightTab === 'section' ? 'flex' : 'none', flexDirection: 'column' }}>
              <SectionInspector section={activeSection} onUpdate={updateSection}
                onOpenImageSearch={openImageSearchForBg} />
              <div className="border-t border-zinc-800 p-4 mt-auto">
                <AiImportPanel onApply={handleAiApply} currentSections={sections} />
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={imageSearchOpen}
        initialQuery={imageSearchInitialQuery}
        onClose={() => setImageSearchOpen(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
