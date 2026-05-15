import { useState } from 'react';

// ── Type labels ──────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  text: '📝 Texto', image: '🖼️ Imagen', metric: '📊 Métrica',
  timeline: '📅 Timeline', comparison: '⚖️ Comparación', formula: '🧮 Fórmula',
  code: '💻 Código', bento: '🧩 Bento', counter: '🔢 Contador', blockquote: '💬 Cita',
};

// ── Shared input component ───────────────────────────────────────────────────
function InspectorInput({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="text-[10px] text-neutral-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded p-1.5 text-white text-xs focus:outline-none focus:border-cyan-700" {...rest} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ElementInspector({ el, onUpdate, onDuplicate, onOpenImageSearch }) {
  const [localQuery, setLocalQuery] = useState('');

  if (!el) return (
    <div className="p-4 text-center text-neutral-600 text-xs py-10">
      Selecciona un elemento en<br />el canvas para editar
    </div>
  );

  const s = el.style || {};
  const upd = (changes) => onUpdate({ style: { ...s, ...changes } });

  // Helper for updating items in arrays (timeline, bento, comparison)
  const updateItem = (arrKey, index, changes) => {
    const arr = [...(el[arrKey] || [])];
    arr[index] = { ...arr[index], ...changes };
    onUpdate({ [arrKey]: arr });
  };
  const addItem = (arrKey, template) => onUpdate({ [arrKey]: [...(el[arrKey] || []), template] });
  const removeItem = (arrKey, index) => onUpdate({ [arrKey]: (el[arrKey] || []).filter((_, i) => i !== index) });

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          {TYPE_LABELS[el.type] || el.type}
        </span>
        <button onClick={onDuplicate}
          className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-white">
          Duplicar
        </button>
      </div>

      {/* TEXT controls */}
      {el.type === 'text' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">

          {/* ── Content ── */}
          <label className="text-[10px] text-neutral-500">Contenido</label>
          <textarea rows={3} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs resize-none focus:outline-none focus:border-cyan-700" />

          {/* ── Typography ── */}
          <label className="text-[9px] text-cyan-600 uppercase tracking-widest font-bold mt-2">Tipografía</label>

          {/* Font Family */}
          <div>
            <label className="text-[10px] text-neutral-500">Fuente</label>
            <select value={s.fontFamily || 'inherit'}
              onChange={e => upd({ fontFamily: e.target.value })}
              className="w-full bg-black border border-neutral-700 rounded p-1.5 text-white text-xs focus:outline-none"
              style={{ fontFamily: s.fontFamily || 'inherit' }}>
              <option value="inherit">Predeterminada</option>
              <option value="'Inter', sans-serif" style={{ fontFamily: 'Inter' }}>Inter</option>
              <option value="'Montserrat', sans-serif" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
              <option value="'Poppins', sans-serif" style={{ fontFamily: 'Poppins' }}>Poppins</option>
              <option value="'Outfit', sans-serif" style={{ fontFamily: 'Outfit' }}>Outfit</option>
              <option value="'Space Grotesk', sans-serif" style={{ fontFamily: 'Space Grotesk' }}>Space Grotesk</option>
              <option value="'Playfair Display', serif" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
              <option value="'Roboto', sans-serif" style={{ fontFamily: 'Roboto' }}>Roboto</option>
              <option value="'Source Code Pro', monospace" style={{ fontFamily: 'Source Code Pro' }}>Source Code Pro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InspectorInput label="Tamaño (px)" value={s.fontSize || 28} onChange={v => upd({ fontSize: v })} type="number" min="8" max="220" />
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

          {/* ── Spacing ── */}
          <label className="text-[9px] text-cyan-600 uppercase tracking-widest font-bold mt-2">Espaciado</label>

          <div>
            <label className="text-[10px] text-neutral-500">Interlineado: {(s.lineHeight || 1.25).toFixed(2)}</label>
            <input type="range" min="0.8" max="3" step="0.05" value={s.lineHeight || 1.25}
              onChange={e => upd({ lineHeight: +e.target.value })}
              className="w-full accent-cyan-500" />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500">Espaciado letras: {(s.letterSpacing || 0).toFixed(2)}em</label>
            <input type="range" min="-0.05" max="0.5" step="0.01" value={s.letterSpacing || 0}
              onChange={e => upd({ letterSpacing: +e.target.value })}
              className="w-full accent-cyan-500" />
          </div>

          {/* ── Style toggles ── */}
          <label className="text-[9px] text-cyan-600 uppercase tracking-widest font-bold mt-2">Estilo</label>

          <div className="grid grid-cols-3 gap-1">
            <button type="button" onClick={() => upd({ italic: !s.italic })}
              className={`py-1.5 rounded text-xs font-bold border transition-colors ${s.italic ? 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300' : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-white'}`}>
              <i>I</i>
            </button>
            <button type="button" onClick={() => upd({ underline: !s.underline })}
              className={`py-1.5 rounded text-xs font-bold border transition-colors ${s.underline ? 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300' : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-white'}`}>
              <u>U</u>
            </button>
            <button type="button" onClick={() => upd({ strikethrough: !s.strikethrough })}
              className={`py-1.5 rounded text-xs font-bold border transition-colors ${s.strikethrough ? 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300' : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-white'}`}>
              <s>S</s>
            </button>
          </div>

          <div>
            <label className="text-[10px] text-neutral-500">Opacidad: {(s.opacity ?? 1).toFixed(2)}</label>
            <input type="range" min="0.05" max="1" step="0.05" value={s.opacity ?? 1}
              onChange={e => upd({ opacity: +e.target.value })}
              className="w-full accent-cyan-500" />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
            <input type="checkbox" checked={s.textShadow !== false}
              onChange={e => upd({ textShadow: e.target.checked })}
              className="accent-cyan-500" />
            Sombra del texto
          </label>

          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
            <input type="checkbox" checked={s.autoFit !== false}
              onChange={e => upd({ autoFit: e.target.checked })}
              className="accent-cyan-500" />
            Auto-fit: llenar el recuadro
          </label>

          {/* ── Background ── */}
          <label className="text-[9px] text-cyan-600 uppercase tracking-widest font-bold mt-2">Fondo del bloque</label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500">Color fondo</label>
              <div className="flex gap-1 items-center">
                <input type="color" value={s.bgColor || '#000000'}
                  onChange={e => upd({ bgColor: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-black cursor-pointer shrink-0" />
                {s.bgColor && (
                  <button onClick={() => upd({ bgColor: '', bgOpacity: undefined })}
                    className="text-[9px] text-red-400 hover:text-red-300 px-1">Quitar</button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-neutral-500">Opacidad fondo: {((s.bgOpacity ?? 0.5) * 100).toFixed(0)}%</label>
              <input type="range" min="0.05" max="1" step="0.05" value={s.bgOpacity ?? 0.5}
                onChange={e => upd({ bgOpacity: +e.target.value })}
                className="w-full accent-purple-500" disabled={!s.bgColor} />
            </div>
          </div>

          {s.bgColor && (
            <div>
              <label className="text-[10px] text-neutral-500">Radio borde fondo: {s.bgRadius || 0}px</label>
              <input type="range" min="0" max="24" value={s.bgRadius || 0}
                onChange={e => upd({ bgRadius: +e.target.value })}
                className="w-full accent-purple-500" />
            </div>
          )}
        </div>
      )}

      {/* IMAGE controls */}
      {el.type === 'image' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          
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
          <label className="text-[10px] text-neutral-500">URL Avanzada (Imagen)</label>
          <div className="flex gap-1">
            <input type="text" value={el.src || ''} placeholder="https://..."
              onChange={e => onUpdate({ src: e.target.value })}
              className="flex-1 bg-black border border-neutral-700 rounded p-2 text-neutral-400 text-[10px] focus:outline-none focus:border-cyan-700" />
          </div>
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
          <InspectorInput label="Valor grande" value={el.val || ''} onChange={v => onUpdate({ val: v })} />
          <InspectorInput label="Título cyan" value={el.title || ''} onChange={v => onUpdate({ title: v })} />
          <InspectorInput label="Descripción" value={el.desc || ''} onChange={v => onUpdate({ desc: v })} />
          <InspectorInput label="Tamaño número (px)" value={s.fontSize || 64} onChange={v => upd({ fontSize: v })} type="number" min="24" max="180" />
        </div>
      )}

      {/* TIMELINE controls */}
      {el.type === 'timeline' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <InspectorInput label="Título general" value={el.title || ''} onChange={v => onUpdate({ title: v })} />
          <div>
            <label className="text-[10px] text-neutral-500">Color acento</label>
            <input type="color" value={s.color || '#22d3ee'}
              onChange={e => upd({ color: e.target.value })}
              className="w-full h-7 rounded border border-neutral-700 bg-black cursor-pointer" />
          </div>
          <label className="text-[10px] text-neutral-500 mt-1">Eventos ({(el.items||[]).length})</label>
          {(el.items || []).map((item, i) => (
            <div key={i} className="bg-neutral-900 rounded-lg p-2 flex flex-col gap-1 border border-neutral-800">
              <div className="flex gap-1">
                <input value={item.year||''} placeholder="Año" onChange={e => updateItem('items', i, { year: e.target.value })}
                  className="w-16 bg-black border border-neutral-700 rounded p-1 text-cyan-400 text-[10px] font-bold focus:outline-none" />
                <input value={item.title||''} placeholder="Título" onChange={e => updateItem('items', i, { title: e.target.value })}
                  className="flex-1 bg-black border border-neutral-700 rounded p-1 text-white text-[10px] focus:outline-none" />
                <button onClick={() => removeItem('items', i)} className="text-red-400 text-xs px-1">×</button>
              </div>
              <input value={item.desc||''} placeholder="Descripción" onChange={e => updateItem('items', i, { desc: e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-neutral-400 text-[10px] focus:outline-none" />
            </div>
          ))}
          <button onClick={() => addItem('items', { year: '', title: 'Nuevo evento', desc: '' })}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 py-1">+ Agregar evento</button>
        </div>
      )}

      {/* COMPARISON controls */}
      {el.type === 'comparison' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Columnas ({(el.columns||[]).length})</label>
          {(el.columns || []).map((col, ci) => (
            <div key={ci} className="bg-neutral-900 rounded-lg p-2 flex flex-col gap-1 border border-neutral-800">
              <div className="flex gap-1 items-center">
                <input type="color" value={col.color || '#22d3ee'}
                  onChange={e => updateItem('columns', ci, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-neutral-700 bg-black cursor-pointer" />
                <input value={col.title||''} placeholder="Título" onChange={e => updateItem('columns', ci, { title: e.target.value })}
                  className="flex-1 bg-black border border-neutral-700 rounded p-1 text-white text-[10px] focus:outline-none" />
                <button onClick={() => removeItem('columns', ci)} className="text-red-400 text-xs px-1">×</button>
              </div>
              {(col.items || []).map((item, ii) => (
                <div key={ii} className="flex gap-1">
                  <input value={item} onChange={e => {
                    const newItems = [...col.items]; newItems[ii] = e.target.value;
                    updateItem('columns', ci, { items: newItems });
                  }} className="flex-1 bg-black border border-neutral-700 rounded p-1 text-neutral-300 text-[10px] focus:outline-none" />
                  <button onClick={() => {
                    const newItems = col.items.filter((_, j) => j !== ii);
                    updateItem('columns', ci, { items: newItems });
                  }} className="text-red-400 text-[10px]">×</button>
                </div>
              ))}
              <button onClick={() => updateItem('columns', ci, { items: [...(col.items||[]), 'Nuevo item'] })}
                className="text-[10px] text-cyan-400">+ Item</button>
            </div>
          ))}
          <button onClick={() => addItem('columns', { title: 'Nueva columna', items: ['Item 1'], color: '#22d3ee' })}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 py-1">+ Agregar columna</button>
        </div>
      )}

      {/* FORMULA controls */}
      {el.type === 'formula' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Fórmula LaTeX</label>
          <textarea rows={2} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            placeholder="E = mc^2"
            className="w-full bg-black border border-neutral-700 rounded p-2 text-green-300 text-xs font-mono resize-none focus:outline-none" />
          <InspectorInput label="Etiqueta" value={el.label || ''} onChange={v => onUpdate({ label: v })} />
          <InspectorInput label="Tamaño (px)" value={s.fontSize || 32} onChange={v => upd({ fontSize: v })} type="number" min="16" max="120" />
        </div>
      )}

      {/* CODE controls */}
      {el.type === 'code' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <div>
            <label className="text-[10px] text-neutral-500">Lenguaje</label>
            <select value={el.language || 'python'}
              onChange={e => onUpdate({ language: e.target.value })}
              className="w-full bg-black border border-neutral-700 rounded p-1 text-white text-xs focus:outline-none">
              {['python','javascript','sql','html','css','java','c','bash','json','text'].map(l =>
                <option key={l} value={l}>{l}</option>
              )}
            </select>
          </div>
          <label className="text-[10px] text-neutral-500">Código</label>
          <textarea rows={6} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-green-300 text-xs font-mono resize-none focus:outline-none" />
          <InspectorInput label="Tamaño fuente" value={s.fontSize || 14} onChange={v => upd({ fontSize: v })} type="number" min="10" max="24" />
        </div>
      )}

      {/* BENTO controls */}
      {el.type === 'bento' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Items ({(el.items||[]).length})</label>
          {(el.items || []).map((item, i) => (
            <div key={i} className="bg-neutral-900 rounded-lg p-2 flex flex-col gap-1 border border-neutral-800">
              <div className="flex gap-1">
                <input value={item.icon||''} placeholder="🚀" onChange={e => updateItem('items', i, { icon: e.target.value })}
                  className="w-10 bg-black border border-neutral-700 rounded p-1 text-center text-sm focus:outline-none" />
                <input value={item.title||''} placeholder="Título" onChange={e => updateItem('items', i, { title: e.target.value })}
                  className="flex-1 bg-black border border-neutral-700 rounded p-1 text-white text-[10px] focus:outline-none" />
                <select value={item.size||'small'} onChange={e => updateItem('items', i, { size: e.target.value })}
                  className="w-14 bg-black border border-neutral-700 rounded p-1 text-[9px] text-neutral-400 focus:outline-none">
                  <option value="small">S</option>
                  <option value="large">L</option>
                </select>
                <button onClick={() => removeItem('items', i)} className="text-red-400 text-xs px-1">×</button>
              </div>
              <input value={item.desc||''} placeholder="Descripción" onChange={e => updateItem('items', i, { desc: e.target.value })}
                className="w-full bg-black border border-neutral-700 rounded p-1 text-neutral-400 text-[10px] focus:outline-none" />
            </div>
          ))}
          <button onClick={() => addItem('items', { title: 'Nuevo', desc: '', icon: '⚡', size: 'small' })}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 py-1">+ Agregar item</button>
        </div>
      )}

      {/* COUNTER controls */}
      {el.type === 'counter' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <InspectorInput label="Valor numérico" value={el.val || '0'} onChange={v => onUpdate({ val: v })} />
          <InspectorInput label="Sufijo (+, %, K, etc)" value={el.suffix || ''} onChange={v => onUpdate({ suffix: v })} />
          <InspectorInput label="Título" value={el.title || ''} onChange={v => onUpdate({ title: v })} />
          <InspectorInput label="Descripción" value={el.desc || ''} onChange={v => onUpdate({ desc: v })} />
          <InspectorInput label="Tamaño número" value={s.fontSize || 96} onChange={v => upd({ fontSize: v })} type="number" min="32" max="200" />
        </div>
      )}

      {/* BLOCKQUOTE controls */}
      {el.type === 'blockquote' && (
        <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <label className="text-[10px] text-neutral-500">Cita</label>
          <textarea rows={3} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs resize-none focus:outline-none italic" />
          <InspectorInput label="Autor" value={el.author || ''} onChange={v => onUpdate({ author: v })} />
          <InspectorInput label="Tamaño texto" value={s.fontSize || 28} onChange={v => upd({ fontSize: v })} type="number" min="16" max="72" />
          <div>
            <label className="text-[10px] text-neutral-500">Color</label>
            <input type="color" value={s.color || '#ffffff'}
              onChange={e => upd({ color: e.target.value })}
              className="w-full h-7 rounded border border-neutral-700 bg-black cursor-pointer" />
          </div>
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
