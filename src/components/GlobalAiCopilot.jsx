import { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const PERSONALITIES = {
  brayan: { id: 'brayan', emoji: '🧢', name: 'El Brayan', color: 'linear-gradient(135deg, #a855f7, #6366f1)', tooltip: 'Habla como tu pata de la pichanga. Te ayuda con confianza, mucha jerga peruana y cero filtros.' },
  renegon: { id: 'renegon', emoji: '⚡', name: 'El Renegón', color: 'linear-gradient(135deg, #ef4444, #b91c1c)', tooltip: 'Está estresado porque no ha dormido. Te va a trolear si tu diapo está tela. Úsalo si aguantas el sarcasmo.' },
  catedratico: { id: 'catedratico', emoji: '🎓', name: 'Catedrático', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', tooltip: 'Tu asesor de tesis personal. Se enfoca en la ortografía y la jerarquía visual impecable.' },
  motivador: { id: 'motivador', emoji: '🚀', name: 'Motivador', color: 'linear-gradient(135deg, #f59e0b, #d97706)', tooltip: 'Tu fan número uno. Para él, todo lo que haces es arte. Te va a dar ánimos constantes.' },
  cientifico: { id: 'cientifico', emoji: '⚛️', name: 'Científico', color: 'linear-gradient(135deg, #10b981, #047857)', tooltip: 'Un genio incomprendido que explicará el diseño usando la mecánica cuántica y física.' }
};

export default function GlobalAiCopilot() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';
  
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [verbosity, setVerbosity] = useState('short');
  const [personality, setPersonality] = useState('brayan');

  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: `¡Hola, ${displayName.toUpperCase()}! Soy tu asistente virtual global. Selecciona una personalidad arriba y charlemos sobre lo que quieras.` }
  ]);

  const endOfMessagesRef = useRef(null);

  // Load personality from Supabase
  useEffect(() => {
    const loadPersonality = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('ai_personality').eq('id', user.id).single();
      if (data && data.ai_personality) {
        setPersonality(data.ai_personality);
      }
    };
    loadPersonality();
  }, [user?.id]);

  const handlePersonalityChange = async (newPersonality) => {
    setPersonality(newPersonality);
    if (user?.id) {
      await supabase.from('profiles').update({ ai_personality: newPersonality }).eq('id', user.id);
    }
    setChatHistory(prev => [...prev, { role: 'assistant', text: `*Personalidad cambiada a ${PERSONALITIES[newPersonality].name} ${PERSONALITIES[newPersonality].emoji}*` }]);
  };

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isGenerating, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userText = prompt.trim();
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsGenerating(true);

    try {
      const historyPayload = chatHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.text
      }));

      const { data, error } = await supabase.functions.invoke('pablito-copilot', {
        body: {
          prompt: userText,
          verbosity,
          personality,
          username: displayName,
          chatHistory: historyPayload,
          mode: 'global' // Indicamos modo global
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
        { role: 'assistant', text: `❌ Hubo un error: ${err.message}.\n\nInténtalo de nuevo.` }
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  // Si no hay usuario o estamos en el editor, no renderizamos nada
  if (!user || location.pathname.startsWith('/editor') || location.pathname.startsWith('/projector') || location.pathname.startsWith('/remote')) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all hover:scale-110"
        style={{ 
          background: PERSONALITIES[personality].color, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.1)'
        }}
      >
        {isOpen ? '✕' : PERSONALITIES[personality].emoji}
      </button>

      {/* Overlay Oscuro (opcional, para cerrar al hacer clic afuera) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel Deslizante Lateral */}
      <div 
        className={`fixed top-0 right-0 h-full w-[350px] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col bg-neutral-900 border-l border-neutral-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 shrink-0 relative"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0d2e 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black transition-all"
                  style={{ background: PERSONALITIES[personality].color, boxShadow: '0 0 16px rgba(0,0,0,0.5)' }}>
                  {PERSONALITIES[personality].emoji}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-neutral-900"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-wider text-white transition-colors">
                    P.A.B.L.O. <span className="text-neutral-400 font-normal text-xs">| {PERSONALITIES[personality].name}</span>
                  </h3>
                  <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-700/50 px-1.5 py-0.5 rounded-full font-bold tracking-widest">
                    GLOBAL
                  </span>
                </div>
                <p className="text-[9px] text-neutral-600 mt-0.5 italic">Tu asistente virtual</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors p-1">
              ✕
            </button>
          </div>
        </div>

        {/* Personality Selector Toolbar */}
        <div className="px-4 py-2 border-b border-neutral-800 bg-black flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
          {Object.values(PERSONALITIES).map(p => (
            <button
              key={p.id}
              onClick={() => handlePersonalityChange(p.id)}
              title={p.tooltip}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap
                ${personality === p.id ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-transparent text-neutral-500 hover:bg-neutral-900 border border-transparent'}`}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
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
          <div className="flex items-center justify-between bg-black border border-neutral-800 rounded-lg p-1.5">
            <span className="text-[9px] text-neutral-500 font-bold ml-2 uppercase tracking-widest">Largo de Respuestas:</span>
            <div className="flex gap-1 bg-neutral-900 rounded-md p-1 border border-neutral-800">
              <button type="button" onClick={() => setVerbosity('short')} className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'short' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>Corta</button>
              <button type="button" onClick={() => setVerbosity('medium')} className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'medium' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>Media</button>
              <button type="button" onClick={() => setVerbosity('long')} className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === 'long' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>Larga</button>
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
              placeholder="Ej: Cuéntame un chiste..."
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
              Enviar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
