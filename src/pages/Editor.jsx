import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import CanvasElement from '../components/CanvasElement';
import AiImportPanel from '../components/AiImportPanel';
import AiCopilotPanel from '../components/AiCopilotPanel';
import ImageSearchModal from '../components/ImageSearchModal';
import { Menu, Settings, X } from 'lucide-react';

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
const TYPE_LABELS = {
  text: '📝 Texto', image: '🖼️ Imagen', metric: '📊 Métrica',
  timeline: '📅 Timeline', comparison: '⚖️ Comparación', formula: '🧮 Fórmula',
  code: '💻 Código', bento: '🧩 Bento', counter: '🔢 Contador', blockquote: '💬 Cita',
};

function InspectorInput({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div>
      <label className="text-[10px] text-neutral-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)}
        className="w-full bg-black border border-neutral-700 rounded p-1.5 text-white text-xs focus:outline-none focus:border-cyan-700" {...rest} />
    </div>
  );
}

function ElementInspector({ el, onUpdate, onDuplicate, onOpenImageSearch }) {
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
          <label className="text-[10px] text-neutral-500">Contenido</label>
          <textarea rows={3} value={el.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs resize-none focus:outline-none focus:border-cyan-700" />
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

// ── Section Inspector ─────────────────────────────────────────────────────────
function SectionInspector({ section, onUpdate, onOpenImageSearch }) {
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

// ── Main Editor ───────────────────────────────────────────────────────────────
export default function Editor() {
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

  // ── Undo stack (for AI changes) ────────────────────────────────────────
  const undoStack = useRef([]); // up to 10 snapshots


  const canvasRef  = useRef(null);
  const saveTimer  = useRef(null);

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
    setSaveStatus('dirty');
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
      <div className="hidden md:flex h-11 border-b border-neutral-800 items-center justify-between px-4 shrink-0 bg-black/80 backdrop-blur z-50">
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
          {canEdit && (
            <div className="order-2 md:order-1 h-12 md:h-12 border-t border-b md:border-t-0 border-zinc-800 flex items-center gap-2 shrink-0 bg-zinc-900/40 overflow-x-auto scrollbar-hide px-3 py-1">
              <span className="hidden sm:inline text-[10px] text-zinc-500 font-mono uppercase mr-1 mt-0.5">Añadir bloque:</span>
              {[
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
              ].map(({ type, label }) => (
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
          )}

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
                onOpenImageSearch={(query) => { if (selectedEl) { setImageSearchTarget(selectedEl.id); setImageSearchInitialQuery(query || ''); setImageSearchOpen(true); } }}
              />
            </div>
            <div style={{ display: rightTab === 'section' ? 'flex' : 'none', flexDirection: 'column' }}>
              <SectionInspector section={activeSection} onUpdate={updateSection}
                onOpenImageSearch={(query) => { setImageSearchTarget('bg'); setImageSearchInitialQuery(query || ''); setImageSearchOpen(true); }} />
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
        onSelect={(url) => {
          if (imageSearchTarget === 'bg') {
            updateSection({ bgImage: url });
          } else if (imageSearchTarget) {
            updateElement(imageSearchTarget, { src: url });
          }
          setImageSearchOpen(false);
        }}
      />
    </div>
  );
}
