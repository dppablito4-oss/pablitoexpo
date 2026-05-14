/**
 * AiCopilotPanel.jsx — Panel de chat IA para el Editor.
 *
 * La lógica de chat, créditos, personalidad y submit vive en useAiChat.
 * Este componente solo maneja el layout y la UI del panel lateral.
 */
import PERSONALITIES from '../config/personalities';
import PersonalitySelector from './PersonalitySelector';
import useAiChat from '../hooks/useAiChat';

export default function AiCopilotPanel({ currentSections }) {
  const chat = useAiChat({
    mode: 'editor',
    currentSections,
    initialMessage: '¡Habla! Soy P.A.B.L.O., tu co-piloto de confianza. Selecciona una personalidad arriba y charlemos sobre tus diapositivas.',
  });

  const {
    prompt, setPrompt, isGenerating, verbosity, setVerbosity,
    personality, aiVerified, userCredits, chatHistory,
    endOfMessagesRef, handlePersonalityChange, handleSubmit,
  } = chat;

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">

      {/* Header */}
      <div className="p-4 border-b border-neutral-800 shrink-0 relative"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0d2e 100%)' }}>
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
              <span className="text-[8px] bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-700/50 px-1.5 py-0.5 rounded-full font-bold tracking-widest">
                ASESOR
              </span>
            </div>
            <p className="text-[9px] text-neutral-600 mt-0.5 italic flex items-center gap-1.5">
              Tu copiloto creativo
              <span className={`font-bold not-italic px-1.5 py-0.5 rounded text-[8px] ${userCredits <= 0 ? 'bg-red-900/50 text-red-400 border border-red-700/40' :
                userCredits <= 20 ? 'bg-amber-900/50 text-amber-400 border border-amber-700/40' :
                  'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30'
                }`}>
                ⚡ {userCredits} créditos
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Personality Selector — componente compartido */}
      <PersonalitySelector current={personality} onChange={handlePersonalityChange} />

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
            {['short', 'medium', 'long'].map(v => (
              <button key={v} type="button" onClick={() => setVerbosity(v)}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${verbosity === v ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                {v === 'short' ? 'Corta' : v === 'medium' ? 'Media' : 'Larga'}
              </button>
            ))}
          </div>
        </div>

        {aiVerified ? (
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Ej: ¿Qué secciones me faltan añadir para hablar sobre Galaxias?..."
              disabled={isGenerating}
              rows={3}
              className="w-full bg-black border border-neutral-700 rounded-lg p-3 pb-10
                         text-white text-xs resize-none
                         focus:border-fuchsia-500/60 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button type="submit" disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider
                         text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
              Preguntar
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2 bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4 text-center mt-2">
            <div className="text-xl mb-1 mt-2">🔒</div>
            <p className="text-xs text-neutral-300 font-bold tracking-wide uppercase">Cerebro de P.A.B.L.O. Asegurado</p>
            <p className="text-[10px] text-neutral-500 mb-2 px-2 pb-2 leading-relaxed">
              El motor cognitivo está bloqueado. Abre tu <span className="text-fuchsia-400">Asistente Global</span> (botón flotante inferior derecho) e introduce tu código OTP.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
