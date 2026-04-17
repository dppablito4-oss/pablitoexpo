import { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function AiCopilotPanel({ currentSections, onApplyChanges }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: '¡Qué tal! Soy P.A.B.L.O., tu asistente de presentaciones creado especialmente para Pablito_dp 🚀 Puedo cambiar colores, textos, añadir secciones completas o ajustar cualquier cosa del lienzo. ¿Qué necesitas hoy?' }
  ]);
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll al final del chat
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGenerating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userText = prompt.trim();
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsGenerating(true);

    try {
      // Llamar a la edge function de Supabase
      const { data, error } = await supabase.functions.invoke('pablito-copilot', {
        body: {
          prompt: userText,
          currentSections: currentSections // Pasamos el canvas entero para contexto
        }
      });

      if (error) throw new Error(error.message);

      if (data && data.sections) {
        // ── PROTECCIÓN ANTI-BORRADO ────────────────────────────────────────
        // Si la IA devuelve MENOS secciones que las actuales, fusionamos:
        // conservamos todas las originales y añadimos solo las nuevas.
        let finalSections = data.sections;
        if (data.sections.length < currentSections.length) {
          // Detectar qué IDs son nuevos (no estaban en el original)
          const originalIds = new Set(currentSections.map(s => s.id));
          const newSections = data.sections.filter(s => !originalIds.has(s.id));
          // Mezclar: originales actualizados (si la IA los incluyó) + nuevos
          const updatedOriginals = currentSections.map(orig => {
            const aiVersion = data.sections.find(s => s.id === orig.id);
            return aiVersion || orig; // Si la IA lo modificó, usar versión IA; si no, conservar original
          });
          finalSections = [...updatedOriginals, ...newSections];
        }

        onApplyChanges(finalSections);
        const successMsgs = [
          '¡Hecho! He aplicado los cambios en tu lienzo. ✨',
          '¡Listo, Pablito! Los cambios ya están en tu canvas. 🔥',
          '¡Ejecutado! ¿Qué más le damos? 🚀',
          '¡Pa\'lante! Cambios aplicados. 💪',
        ];
        setChatHistory(prev => prev.filter(m => m.role !== 'thinking').concat(
          { role: 'assistant', text: successMsgs[Math.floor(Math.random() * successMsgs.length)] }
        ));
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Respuesta inválida de la IA");
      }

    } catch (err) {
      console.error(err);
      setChatHistory(prev => prev.filter(m => m.role !== 'thinking').concat(
        { role: 'assistant', text: `❌ P.A.B.L.O. tuvo un error: ${err.message}. Inténtalo de nuevo.` }
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      
      {/* Header Copiloto */}
      <div className="p-4 border-b border-neutral-800 shrink-0"
           style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0d2e 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
                 style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', boxShadow: '0 0 16px rgba(168,85,247,0.5)' }}>
              P
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-neutral-900"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wider"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                P.A.B.L.O.
              </h3>
              <span className="text-[8px] bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-700/50 px-1.5 py-0.5 rounded-full font-bold tracking-widest">
                IA
              </span>
            </div>
            <p className="text-[9px] text-neutral-600 mt-0.5 italic">Protocolo de Asistencia y Bits para Lienzos Optimizados</p>
          </div>
        </div>
      </div>

      {/* Historial de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar flex flex-col">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-sm' 
                : 'bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-tl-sm'}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-lg p-3 rounded-tl-sm w-fit flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
              <span className="text-[10px] uppercase tracking-widest">Calculando magia...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input de Prompt */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ej: Cambia el color del título a rojo brillante..."
            disabled={isGenerating}
            rows={3}
            className="w-full bg-black border border-neutral-700 rounded-lg p-3 pb-10
                       text-white text-xs resize-none
                       focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider
                       bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Enviar
          </button>
        </form>
        <p className="mt-2 text-[9px] text-neutral-600 text-center">
          Pro-tip: Presiona <kbd className="bg-neutral-800 px-1 py-0.5 rounded">Enter</kbd> para enviar.
        </p>
      </div>

    </div>
  );
}
