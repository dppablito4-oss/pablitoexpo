import { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export default function AiCopilotPanel({ currentSections }) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [verbosity, setVerbosity] = useState('short'); // 'short' | 'medium' | 'long'

  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: `¡Habla, ${displayName.toUpperCase()}! Soy P.A.B.L.O., tu co-piloto de confianza en esta bóveda. 🚀\n\nHe chequeado tu lienzo y estoy listo para tirarte las fijas. Pregúntame lo que sea: desde paletas de colores finas hasta qué temas te faltan para que no paltees en la expo. Aquí estamos para que ese proyecto salga. ¿Qué sale hoy, causa? ¡GAAA!` }
  ]);

  const endOfMessagesRef = useRef(null);
  const messageCountRef = useRef(0);

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
    
    messageCountRef.current += 1;
    const shouldProfile = (messageCountRef.current % 5 === 0);

    try {
      const { data, error } = await supabase.functions.invoke('pablito-copilot', {
        body: {
          prompt: userText,
          currentSections: currentSections,
          verbosity,
          username: displayName,
          shouldProfile,
        }
      });

      if (error) throw new Error(error.message);

      if (data && data.message) {
        setChatHistory(prev => prev.filter(m => m.role !== 'thinking').concat(
          { role: 'assistant', text: data.message }
        ));
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Respuesta inválida de la IA');
      }

    } catch (err) {
      console.error(err);
      setChatHistory(prev => prev.filter(m => m.role !== 'thinking').concat(
        { role: 'assistant', text: `❌ P.A.B.L.O. tuvo un error: ${err.message}.\n\nInténtalo de nuevo.` }
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">

      {/* Header */}
      <div className="p-4 border-b border-neutral-800 shrink-0"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0d2e 100%)' }}>
        <div className="flex items-center justify-between">
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
                  ASESOR
                </span>
              </div>
              <p className="text-[9px] text-neutral-600 mt-0.5 italic">Tu copiloto creativo de contenido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar flex flex-col">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-line
              ${msg.role === 'user'
                ? 'text-white rounded-tr-sm'
                : 'bg-neutral-800/80 text-neutral-300 border border-neutral-700/40 rounded-tl-sm'}`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="border rounded-xl p-3 rounded-tl-sm w-fit flex items-center gap-2"
              style={{ background: '#0f0a1e', borderColor: 'rgba(168,85,247,0.3)' }}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] text-fuchsia-400 uppercase tracking-widest">P.A.B.L.O. pensando...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 shrink-0 flex flex-col gap-3">
        {/* Verbosity Selector */}
        <div className="flex items-center justify-between bg-black border border-neutral-800 rounded-lg p-1.5">
          <span className="text-[9px] text-neutral-500 font-bold ml-2 uppercase tracking-widest">Largo de Respuestas:</span>
          <div className="flex gap-1 bg-neutral-900 rounded-md p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setVerbosity('short')}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'short' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Corta
            </button>
            <button
              type="button"
              onClick={() => setVerbosity('medium')}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'medium' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setVerbosity('long')}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'long' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Larga
            </button>
          </div>
        </div>

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
            placeholder="Ej: ¿Qué secciones me faltan añadir para hablar sobre Galaxias?..."
            disabled={isGenerating}
            rows={3}
            className="w-full bg-black border border-neutral-700 rounded-lg p-3 pb-10
                       text-white text-xs resize-none
                       focus:border-fuchsia-500/60 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider
                       text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            Preguntar
          </button>
        </form>
      </div>
    </div>
  );
}
