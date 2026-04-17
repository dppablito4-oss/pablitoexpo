import { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function AiCopilotPanel({ currentSections, onApplyChanges }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: '¡Hola! Soy tu Copiloto. Puedo cambiar colores, añadir secciones o ajustar textos de toda tu presentación. ¿Qué necesitas?' }
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
        // Éxito: aplicamos la nueva data al Editor
        onApplyChanges(data.sections);
        setChatHistory(prev => [...prev, { role: 'assistant', text: '¡Hecho! He aplicado los cambios en el lienzo. ✨' }]);
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Respuesta inválida de la IA");
      }

    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', text: `❌ Hubo un error: ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      
      {/* Header Copiloto */}
      <div className="p-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950 shrink-0">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="text-xs font-bold text-cyan-400 tracking-wider">COPILOTO IA</h3>
          <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">Potenciado por OpenAI</p>
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
            placeholder="Ej: Cambia el título de la sección 2 a rojo..."
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
