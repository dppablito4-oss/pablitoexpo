// ── Block type buttons for the canvas toolbar ───────────────────────────────
const BLOCK_TYPES = [
  { type: 'text',       label: '📝' },
  { type: 'image',      label: '🖼️' },
  { type: 'metric',     label: '📊' },
  { type: 'timeline',   label: '📅' },
  { type: 'comparison', label: '⚖️' },
  { type: 'formula',    label: '🧮' },
  { type: 'code',       label: '💻' },
  { type: 'bento',      label: '🧩' },
  { type: 'counter',    label: '🔢' },
  { type: 'blockquote', label: '💬' },
];

export default function EditorToolbar({ canEdit, addElement, duplicateElement, selectedEl }) {
  if (!canEdit) return null;

  return (
    <div className="order-2 md:order-1 h-12 md:h-12 border-t border-b md:border-t-0 border-zinc-800 flex items-center gap-2 shrink-0 bg-zinc-900/40 overflow-x-auto scrollbar-hide px-3 py-1">
      <span className="hidden sm:inline text-[10px] text-zinc-500 font-mono uppercase mr-1 mt-0.5">Añadir bloque:</span>
      {BLOCK_TYPES.map(({ type, label }) => (
        <button key={type} onClick={() => addElement(type)} title={type}
          className="px-2.5 py-1.5 md:px-2 md:py-1 rounded-md text-[14px] md:text-[13px] bg-zinc-800 hover:bg-zinc-700
                     text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shrink-0">
          {label}
        </button>
      ))}
      <div className="w-px h-5 bg-zinc-700 mx-1 shrink-0" />
      <button onClick={duplicateElement} disabled={!selectedEl}
        className="px-3 py-1.5 md:px-2.5 md:py-1 rounded-md text-[12px] md:text-[11px] bg-zinc-800 hover:bg-zinc-700
                   text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shrink-0
                   disabled:opacity-25 disabled:cursor-not-allowed">
        ⠿ Duplicar
      </button>
      {selectedEl && (
        <span className="hidden md:inline ml-auto text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded">
          ESC para soltar
        </span>
      )}
    </div>
  );
}
