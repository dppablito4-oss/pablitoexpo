import { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2, 8);

// All available block types for the prompt configurator
const BLOCK_TYPES = [
  { id: 'text',       label: '📝 Texto',       checked: true  },
  { id: 'image',      label: '🖼️ Imagen',      checked: false },
  { id: 'metric',     label: '📊 Métrica',      checked: true  },
  { id: 'timeline',   label: '📅 Timeline',     checked: false },
  { id: 'comparison', label: '⚖️ Comparación',  checked: false },
  { id: 'formula',    label: '🧮 Fórmula',      checked: false },
  { id: 'code',       label: '💻 Código',       checked: false },
  { id: 'bento',      label: '🧩 Bento Grid',   checked: false },
  { id: 'counter',    label: '🔢 Contador',     checked: false },
  { id: 'blockquote', label: '💬 Cita',         checked: false },
];

function buildPrompt(topic, sectionCount, selectedTypes) {
  const typeExamples = {
    text: `{ "id": "el-001", "type": "text", "content": "TÍTULO O PÁRRAFO", "x": 5, "y": 28, "w": 90, "h": 22, "style": { "fontSize": 72, "fontWeight": "900", "color": "#ffffff", "textAlign": "center", "textTransform": "uppercase" } }`,
    image: `{ "id": "el-img", "type": "image", "src": "https://images.unsplash.com/photo-XXXXXXXXX?q=80&w=2070", "x": 20, "y": 15, "w": 40, "h": 35, "style": { "opacity": 1, "borderRadius": 0 } }`,
    metric: `{ "id": "el-met", "type": "metric", "val": "100%", "title": "TÍTULO", "desc": "Descripción corta", "x": 3, "y": 20, "w": 30, "h": 55, "style": { "fontSize": 72 } }`,
    timeline: `{ "id": "el-tl", "type": "timeline", "title": "Historia del Tema", "items": [{ "year": "2020", "title": "Evento clave", "desc": "Qué pasó" }, { "year": "2023", "title": "Otro evento", "desc": "Detalle" }], "x": 5, "y": 8, "w": 40, "h": 80, "style": { "color": "#22d3ee" } }`,
    comparison: `{ "id": "el-cmp", "type": "comparison", "columns": [{ "title": "Opción A", "items": ["Ventaja 1", "Ventaja 2"], "color": "#22d3ee" }, { "title": "Opción B", "items": ["Ventaja 1", "Ventaja 2"], "color": "#a78bfa" }], "x": 5, "y": 10, "w": 55, "h": 75 }`,
    formula: `{ "id": "el-fx", "type": "formula", "content": "E = mc^2", "label": "Ecuación fundamental", "x": 10, "y": 30, "w": 50, "h": 30, "style": { "fontSize": 36 } }`,
    code: `{ "id": "el-cd", "type": "code", "content": "print('Hello')", "language": "python", "x": 8, "y": 10, "w": 50, "h": 50, "style": { "fontSize": 14 } }`,
    bento: `{ "id": "el-bn", "type": "bento", "items": [{ "title": "Característica", "desc": "Detalle", "icon": "🚀", "size": "large" }, { "title": "Otra", "desc": "Detalle", "icon": "⚡", "size": "small" }], "x": 3, "y": 5, "w": 60, "h": 85 }`,
    counter: `{ "id": "el-ct", "type": "counter", "val": "300", "suffix": "+", "title": "USUARIOS", "desc": "registrados", "x": 15, "y": 20, "w": 30, "h": 55, "style": { "fontSize": 96 } }`,
    blockquote: `{ "id": "el-bq", "type": "blockquote", "content": "Una cita inspiradora aquí.", "author": "Autor", "x": 10, "y": 20, "w": 60, "h": 50, "style": { "fontSize": 28 } }`,
  };

  const typesList = selectedTypes.map(t => `- ${t}: ${typeExamples[t] || ''}`).join('\n');

  return `Eres un asistente de presentaciones web. Genera un JSON con contenido REAL y DETALLADO sobre el tema indicado.

TEMA DE LA PRESENTACIÓN: "${topic}"

NÚMERO DE SECCIONES: ${sectionCount} secciones mínimo.

TIPOS DE BLOQUES A USAR (combínalos creativamente):
${typesList}

REGLAS ESTRICTAS:
1. Escribe el JSON dentro de un bloque de código Markdown: \`\`\`json ... \`\`\`
2. Para bgImage usa imágenes REALES de Unsplash: https://images.unsplash.com/photo-XXXXXXXXXX?q=80&w=2070
3. Cada sección debe tener al menos 2 elementos.
4. Alterna tipos de bloques entre secciones para variedad visual.
5. El contenido debe ser REAL y educativo, no placeholder.
6. Las posiciones (x,y,w,h) son porcentajes del viewport. No superpongas elementos.

ESTRUCTURA:
{
  "sections": [
    {
      "id": "sec-001",
      "bgImage": "https://images.unsplash.com/photo-REAL?q=80&w=2070",
      "height": 100,
      "elements": [ ... ]
    }
  ]
}

GENERA ${sectionCount} SECCIONES COMPLETAS con contenido real sobre "${topic}".`;
}

export default function AiImportPanel({ onApply, currentSections = [] }) {
  const [open,    setOpen]    = useState(false);
  const [step,    setStep]    = useState('config'); // 'config' | 'paste'
  const [json,    setJson]    = useState('');
  const [status,  setStatus]  = useState('');
  const [copied,  setCopied]  = useState(false);

  // Config state
  const [topic,        setTopic]        = useState('');
  const [sectionCount, setSectionCount] = useState(6);
  const [blockTypes,   setBlockTypes]   = useState(
    BLOCK_TYPES.map(bt => ({ ...bt }))
  );

  const selectedTypes = blockTypes.filter(b => b.checked).map(b => b.id);

  const toggleType = (id) => {
    setBlockTypes(prev => prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b));
  };

  const generatedPrompt = buildPrompt(topic || 'Tu tema aquí', sectionCount, selectedTypes);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setStep('paste');
    setTimeout(() => setCopied(false), 2000);
  };

  const parseAndApply = (mode) => {
    try {
      let raw = json.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
      raw = raw.replace(/\\#/g, '#');
      raw = raw.replace(/"\[([^\]]*)\]\(([^)]+)\)"/g, '"$2"');
      raw = raw.replace(/\\&/g, '&');
      raw = raw.replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(raw);

      if (parsed.sections && Array.isArray(parsed.sections)) {
        const sanitized = parsed.sections.map(sec => ({
          ...sec,
          id: sec.id || `sec-${uid()}`,
          elements: (sec.elements || []).map(el => ({ ...el, id: el.id || uid() })),
        }));

        if (mode === 'replace') {
          onApply({ sections: sanitized });
        } else {
          // Concatenate: add new sections after existing ones
          onApply({ sections: [...currentSections, ...sanitized] });
        }
      } else {
        onApply(parsed);
      }

      setStatus('ok');
      setJson('');
      setStep('config');
      setTimeout(() => setStatus(''), 3000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="border border-cyan-500/20 rounded-xl overflow-hidden bg-cyan-950/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
          🤖 Importar desde IA
        </span>
        <span className="text-neutral-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">

          {/* ── STEP 1: CONFIG ── */}
          {step === 'config' && (
            <>
              <p className="text-[10px] text-neutral-400">
                <span className="text-cyan-400 font-bold">Paso 1:</span> Configura tu presentación
              </p>

              {/* Topic */}
              <div>
                <label className="text-[10px] text-neutral-500">Tema</label>
                <input
                  type="text" value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Ej: La Guerra Fría, Inteligencia Artificial, El ADN..."
                  className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white text-xs
                             focus:border-cyan-500/50 focus:outline-none mt-1"
                />
              </div>

              {/* Section count */}
              <div>
                <label className="text-[10px] text-neutral-500">Cantidad de secciones: {sectionCount}</label>
                <input type="range" min="3" max="15" value={sectionCount}
                  onChange={e => setSectionCount(+e.target.value)}
                  className="w-full accent-cyan-500 mt-1" />
              </div>

              {/* Block types */}
              <div>
                <label className="text-[10px] text-neutral-500 mb-1 block">Tipos de bloque a incluir:</label>
                <div className="grid grid-cols-2 gap-1">
                  {blockTypes.map(bt => (
                    <label key={bt.id}
                      className={`flex items-center gap-1.5 text-[10px] cursor-pointer px-2 py-1.5 rounded-lg border transition-all
                        ${bt.checked
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                    >
                      <input type="checkbox" checked={bt.checked} onChange={() => toggleType(bt.id)}
                        className="accent-cyan-500" style={{ width: '12px', height: '12px' }} />
                      {bt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Copy prompt button */}
              <button
                onClick={handleCopy}
                disabled={!topic.trim()}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors
                  ${copied
                    ? 'bg-green-600 text-white'
                    : topic.trim()
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
              >
                {copied ? '✅ ¡Prompt copiado! Pégalo en ChatGPT o Gemini' : '📋 Generar y Copiar Prompt'}
              </button>
            </>
          )}

          {/* ── STEP 2: PASTE JSON ── */}
          {step === 'paste' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-neutral-400">
                  <span className="text-cyan-400 font-bold">Paso 2:</span> Pega el JSON que te dio la IA
                </p>
                <button onClick={() => setStep('config')}
                  className="text-[10px] text-neutral-500 hover:text-cyan-400">
                  ← Volver
                </button>
              </div>

              <textarea
                rows={7}
                value={json}
                onChange={e => { setJson(e.target.value); setStatus(''); }}
                placeholder={'{\n  "sections": [...]\n}'}
                className="w-full bg-black border border-neutral-700 rounded-lg p-3
                           text-white text-xs font-mono resize-none
                           focus:border-cyan-500/50 focus:outline-none"
              />

              {/* Action buttons — Replace vs Concatenate */}
              <div className="flex gap-2">
                <button
                  onClick={() => parseAndApply('replace')}
                  disabled={!json.trim()}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold
                             bg-cyan-500 hover:bg-cyan-400 text-black
                             disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ⚡ Reemplazar todo
                </button>
                <button
                  onClick={() => parseAndApply('concat')}
                  disabled={!json.trim()}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold
                             bg-purple-600 hover:bg-purple-500 text-white
                             disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ➕ Añadir al final
                </button>
              </div>

              {/* Re-copy prompt */}
              <button
                onClick={handleCopy}
                className="w-full py-1.5 rounded-lg text-[10px] text-neutral-500
                           bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
              >
                {copied ? '✅ Copiado' : '📋 Copiar prompt de nuevo'}
              </button>

              {status === 'ok'    && <p className="text-green-400 text-xs text-center">✅ ¡Aplicado correctamente!</p>}
              {status === 'error' && <p className="text-red-400 text-xs text-center">❌ JSON inválido. Revisa el formato.</p>}
            </>
          )}

        </div>
      )}
    </div>
  );
}
