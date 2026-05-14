import { useState } from 'react';

export default function SectionInspector({ section, onUpdate, onOpenImageSearch }) {
  const [localQuery, setLocalQuery] = useState('');

  if (!section) return null;
  const overlayOpacity = section.overlayOpacity ?? 0.4;
  return (
    <div className="flex flex-col gap-3 p-4">
      <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">⚙️ Sección</h4>
      
      {/* Nuevo Buscador Directo de Unsplash */}
      <div className="mt-2 flex flex-col items-center bg-neutral-900 border border-neutral-800 rounded-xl p-3">
        <span className="text-[13px] font-bold text-white mb-1">Buscar Imágenes</span>
        <div className="flex flex-col items-center gap-1 mb-3">
            <span className="text-[9px] text-neutral-500">Powered by</span>
            <div className="flex items-center gap-1">
               <svg width="10" height="10" viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path>
                </svg>
               <span className="text-[11px] font-bold text-white tracking-widest">Unsplash</span>
            </div>
        </div>
        <div className="flex gap-1 w-full relative">
           <input 
             type="text" 
             value={localQuery}
             onChange={e => setLocalQuery(e.target.value)}
             onKeyDown={e => { if(e.key === 'Enter') onOpenImageSearch(localQuery.trim()); }}
             placeholder="Escribe algo aquí..."
             className="flex-1 bg-black border border-neutral-700 rounded-lg p-2 pl-3 text-white text-xs focus:outline-none focus:border-cyan-500" 
           />
           <button 
             onClick={() => onOpenImageSearch(localQuery.trim())}
             className="px-3 py-1 rounded-lg bg-cyan-900/50 text-cyan-400 text-xs font-bold hover:bg-cyan-800/50 border border-cyan-700/30 transition-colors">
             Buscar
           </button>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-800 my-2" />

      {/* URL Oculta */}
      <label className="text-[10px] text-neutral-500">URL Avanzada de fondo</label>
      <div className="flex gap-1">
        <input type="text" value={section.bgImage || ''} placeholder="https://..."
          onChange={e => onUpdate({ bgImage: e.target.value })}
          className="flex-1 bg-black border border-neutral-700 rounded p-2 text-neutral-400 text-[10px] focus:outline-none focus:border-emerald-700" />
      </div>
      <label className="text-[10px] text-neutral-500">Altura: {section.height || 100}vh</label>
      <input type="range" min="60" max="300" step="10" value={section.height || 100}
        onChange={e => onUpdate({ height: +e.target.value })}
        className="w-full accent-emerald-500" />
      <label className="text-[10px] text-neutral-500">Oscuridad del overlay: {(overlayOpacity * 100).toFixed(0)}%</label>
      <input type="range" min="0" max="0.9" step="0.05" value={overlayOpacity}
        onChange={e => onUpdate({ overlayOpacity: +e.target.value })}
        className="w-full accent-emerald-500" />
    </div>
  );
}
