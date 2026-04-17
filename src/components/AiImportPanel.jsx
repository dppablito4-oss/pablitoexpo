import { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2, 8);

// The prompt the user copies to ChatGPT / Gemini
const PROMPT = `Eres un asistente de presentaciones web. Dame el siguiente JSON rellenado con contenido real.

MUY IMPORTANTE: Escribe el JSON dentro de un bloque de código Markdown usando \`\`\`json al inicio y \`\`\` al final. De esta forma el formato no se corrompe.

Número de secciones: crea MÍNIMO 5-6 secciones (no te limites al ejemplo de 3). Alterna secciones de texto con secciones de métricas.

Para las URLs de bgImage usa imágenes reales de Unsplash: https://images.unsplash.com/photo-XXXXXXXXXX?q=80&w=2070

Estructura del JSON:

{
  "sections": [
    {
      "id": "sec-001",
      "bgImage": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2070",
      "height": 100,
      "elements": [
        {
          "id": "el-001",
          "type": "text",
          "content": "TÍTULO EN MAYÚSCULAS",
          "x": 5, "y": 28, "w": 90, "h": 22,
          "style": { "fontSize": 72, "fontWeight": "900", "color": "#ffffff", "textAlign": "center", "textTransform": "uppercase" }
        },
        {
          "id": "el-002",
          "type": "text",
          "content": "Una frase poderosa como subtítulo.",
          "x": 15, "y": 56, "w": 70, "h": 12,
          "style": { "fontSize": 22, "fontWeight": "300", "color": "#bbbbbb", "textAlign": "center" }
        }
      ]
    },
    {
      "id": "sec-002",
      "bgImage": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=2070",
      "height": 100,
      "elements": [
        {
          "id": "el-003",
          "type": "text",
          "content": "Encabezado de sección",
          "x": 5, "y": 20, "w": 44, "h": 20,
          "style": { "fontSize": 48, "fontWeight": "700", "color": "#ffffff" }
        },
        {
          "id": "el-004",
          "type": "text",
          "content": "2-3 oraciones descriptivas.",
          "x": 52, "y": 22, "w": 43, "h": 55,
          "style": { "fontSize": 18, "fontWeight": "300", "color": "#cccccc" }
        }
      ]
    },
    {
      "id": "sec-003",
      "bgImage": "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?q=80&w=2070",
      "height": 100,
      "elements": [
        { "id": "el-005", "type": "metric", "val": "VALOR 1", "title": "MÉTRICA 1", "desc": "Descripción corta", "x": 3, "y": 20, "w": 30, "h": 55, "style": { "fontSize": 72 } },
        { "id": "el-006", "type": "metric", "val": "VALOR 2", "title": "MÉTRICA 2", "desc": "Descripción corta", "x": 35, "y": 20, "w": 30, "h": 55, "style": { "fontSize": 72 } },
        { "id": "el-007", "type": "metric", "val": "VALOR 3", "title": "MÉTRICA 3", "desc": "Descripción corta", "x": 67, "y": 20, "w": 30, "h": 55, "style": { "fontSize": 72 } }
      ]
    }
    { "id": "sec-NNN", "bgImage": "https://images.unsplash.com/photo-XXXXXXXXXX?q=80&w=2070", "height": 100, "elements": [] }
  ]
}

El tema de la presentación es: [ESCRIBE TU TEMA AQUÍ]`;

export default function AiImportPanel({ onApply }) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState('');
  const [status, setStatus] = useState(''); // 'ok' | 'error' | ''
  const [copied, setCopied] = useState(false);

  const handleApply = () => {
    try {
      // ── Auto-clean common AI formatting quirks ──────────────────────────────
      let raw = json.trim();

      // 0. Strip markdown code fences: ```json ... ``` or ``` ... ```
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

      // 1. Fix escaped hashes: \# → #
      raw = raw.replace(/\\#/g, '#');

      // 2. Fix markdown links in strings: "[text](url)" → "url"
      //    Picks the URL inside () — the clean one without markdown escapes
      raw = raw.replace(/"\[([^\]]*)\]\(([^)]+)\)"/g, '"$2"');

      // 3. Fix \& inside URLs (markdown escapes & in links) → &
      raw = raw.replace(/\\&/g, '&');

      // 4. Remove trailing commas before } or ] (common AI mistake)
      raw = raw.replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(raw);

      // New format: has sections[]
      if (parsed.sections && Array.isArray(parsed.sections)) {
        // Ensure all IDs are unique and present
        const sanitized = parsed.sections.map(sec => ({
          ...sec,
          id: sec.id || `sec-${uid()}`,
          elements: (sec.elements || []).map(el => ({ ...el, id: el.id || uid() })),
        }));
        onApply({ sections: sanitized });
      }
      // Old format: has heroTitle etc.
      else {
        onApply(parsed); // Editor will migrate via migrateToSections
      }

      setStatus('ok');
      setJson('');
      setTimeout(() => setStatus(''), 3000);
    } catch {
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <p className="text-[10px] text-neutral-400">
            <span className="text-cyan-400 font-bold">Paso 1:</span> Copia el prompt y pégalo en ChatGPT o Gemini
          </p>
          <button
            onClick={handleCopy}
            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors
              ${copied
                ? 'bg-green-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700'}`}
          >
            {copied ? '✅ Copiado!' : '📋 Copiar Prompt'}
          </button>

          <p className="text-[10px] text-neutral-400">
            <span className="text-cyan-400 font-bold">Paso 2:</span> Pega el JSON que te dio la IA
          </p>
          <textarea
            rows={6}
            value={json}
            onChange={e => { setJson(e.target.value); setStatus(''); }}
            placeholder={'{\n  "sections": [...]\n}'}
            className="w-full bg-black border border-neutral-700 rounded-lg p-3
                       text-white text-xs font-mono resize-none
                       focus:border-cyan-500/50 focus:outline-none"
          />

          <button
            onClick={handleApply}
            disabled={!json.trim()}
            className="w-full py-2 rounded-lg text-sm font-bold
                       bg-cyan-500 hover:bg-cyan-400 text-black
                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⚡ Aplicar a la Presentación
          </button>

          {status === 'ok'    && <p className="text-green-400 text-xs text-center">✅ ¡Aplicado correctamente!</p>}
          {status === 'error' && <p className="text-red-400 text-xs text-center">❌ JSON inválido. Revisa el formato.</p>}
        </div>
      )}
    </div>
  );
}
