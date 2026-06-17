import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { deductHP } from '../lib/xpService';
import PERSONALITIES from '../config/personalities';
import PersonalitySelector from './PersonalitySelector';

const MAX_CHATS = 5;
const MAX_MESSAGES_PER_CHAT = 10;
const MAX_INPUT_CHARS = 500;
const OTP_COOLDOWN = 60;

function createNewChat(displayName) {
  return {
    id: Date.now().toString(),
    title: 'Nuevo Chat',
    messages: [
      { role: 'assistant', text: `¡Hola, ${displayName.toUpperCase()}! Soy tu asistente virtual global. Selecciona una personalidad arriba y charlemos sobre lo que quieras.` }
    ],
    createdAt: Date.now()
  };
}

export default function GlobalAiCopilot() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [verbosity, setVerbosity] = useState('short');
  const [personality, setPersonality] = useState('brayan');
  const [showChatList, setShowChatList] = useState(false);

  // Multi-Chat state
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);


  // Créditos IA state
  const [userCredits, setUserCredits] = useState(0);

  // OTP state
  const [aiVerified, setAiVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0); // segundos restantes
  const otpTimerRef = useRef(null);
  const currentOtpRef = useRef('');

  const endOfMessagesRef = useRef(null);

  // Helper: leer chats del localStorage para este usuario
  const getStorageKey = useCallback((uid) => `pablo_chats_${uid}`, []);

  const loadChatsFromStorage = useCallback((uid) => {
    try {
      const raw = localStorage.getItem(getStorageKey(uid));
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }, [getStorageKey]);

  const saveChatsToStorage = useCallback((uid, chatsData) => {
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(chatsData));
    } catch { /* ignore */ }
  }, [getStorageKey]);

  // Inicializar cuando cambia el usuario
  useEffect(() => {
    setIsOpen(false);
    setOtpSent(false);
    setOtpInput('');
    setOtpCooldown(0);
    setPrompt('');
    setShowChatList(false);
    clearInterval(otpTimerRef.current);
    setAiVerified(false);

    if (!user?.id) {
      setChats([]);
      setActiveChatId(null);
      return;
    }

    // Cargar chats del localStorage
    const stored = loadChatsFromStorage(user.id);
    let initialChats;
    if (stored && stored.length > 0) {
      initialChats = stored;
    } else {
      const newChat = createNewChat(displayName);
      initialChats = [newChat];
    }
    setChats(initialChats);
    setActiveChatId(initialChats[0].id);

    // Cargar estado de la BD
    const loadProfileState = async () => {
      const { data } = await supabase.from('profiles').select('ai_personality, ai_verified, ai_credits').eq('id', user.id).single();
      if (data) {
        if (data.ai_personality) setPersonality(data.ai_personality);
        setAiVerified(!!data.ai_verified);
        if (data.ai_credits !== undefined) setUserCredits(data.ai_credits);
      }
    };
    loadProfileState();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar chats en localStorage cada vez que cambian
  useEffect(() => {
    if (user?.id && chats.length > 0) {
      saveChatsToStorage(user.id, chats);
    }
  }, [chats, user?.id, saveChatsToStorage]);

  // Scroll al último mensaje
  useEffect(() => {
    if (isOpen) endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isGenerating, isOpen, activeChatId]);

  // Countdown timer del OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    otpTimerRef.current = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(otpTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(otpTimerRef.current);
  }, [otpCooldown]);

  // Helpers para chats activos
  const activeChat = chats.find(c => c.id === activeChatId);
  const chatHistory = activeChat?.messages || [];

  const updateActiveChat = (updater) => {
    setChats(prev => prev.map(c => c.id === activeChatId ? updater(c) : c));
  };

  const addMessage = (msg, chatId = activeChatId) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const newMessages = [...c.messages, msg].slice(-MAX_MESSAGES_PER_CHAT);
      // Actualizar título del chat con el primer mensaje del usuario
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '…' : '') : c.title;
      return { ...c, messages: newMessages, title };
    }));
  };

  const handlePersonalityChange = async (newPersonality) => {
    setPersonality(newPersonality);
    if (user?.id) {
      await supabase.from('profiles').update({ ai_personality: newPersonality }).eq('id', user.id);
    }
    addMessage({ role: 'assistant', text: `*Personalidad cambiada a ${PERSONALITIES[newPersonality].name} ${PERSONALITIES[newPersonality].emoji}*` });
  };

  const handleNewChat = () => {
    const newChat = createNewChat(displayName);
    setChats(prev => {
      const updated = [newChat, ...prev].slice(0, MAX_CHATS);
      return updated;
    });
    setActiveChatId(newChat.id);
    setShowChatList(false);
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setShowChatList(false);
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation(); // No abrir el chat al borrar
    setChats(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      if (updated.length === 0) {
        // Si borras el único chat, crea uno nuevo vacío
        const fresh = createNewChat(displayName);
        setActiveChatId(fresh.id);
        return [fresh];
      }
      // Si borras el chat activo, activa el primero de la lista
      if (chatId === activeChatId) setActiveChatId(updated[0].id);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userText = prompt.trim().slice(0, MAX_INPUT_CHARS);
    setPrompt('');
    addMessage({ role: 'user', text: userText });
    setIsGenerating(true);

    try {
      // ⚡ Verificar y descontar créditos antes de llamar a la IA
      if (user?.id) {
        const hpResult = await deductHP(supabase, user.id, personality);
        if (!hpResult.success) {
          addMessage({ role: 'assistant', text: `⚡ ${hpResult.error}` });
          setIsGenerating(false);
          return;
        } else {
          setUserCredits(hpResult.remainingHP);
        }
      }

      const historyPayload = chatHistory.slice(-10).map(m => ({ role: m.role, content: m.text }));

      const { data, error } = await supabase.functions.invoke('pablito-copilot', {
        body: { prompt: userText, verbosity, personality, username: displayName, chatHistory: historyPayload, mode: 'global' }
      });

      if (error) throw new Error(error.message);

      if (data?.message) {
        addMessage({ role: 'assistant', text: data.message });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Respuesta inválida de la IA');
      }
    } catch (err) {
      console.error(err);
      addMessage({ role: 'assistant', text: `❌ Error: ${err.message}.\n\nInténtalo de nuevo.` });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- OTP Handlers ---
  const handleRequestOTP = async () => {
    if (otpCooldown > 0) return;
    setIsGenerating(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const { error: updateErr } = await supabase.from('profiles').update({ otp_code: code }).eq('id', user.id);

      if (updateErr) {
        alert('Error crítico guardando en BBDD: ' + updateErr.message);
        return;
      }

      await supabase.functions.invoke('pablito-mailer', {
        body: { action: 'SEND_OTP', payload: { email: user.email, username: displayName, code } }
      });

      setOtpSent(true);
      setOtpCooldown(OTP_COOLDOWN);
      addMessage({ role: 'assistant', text: `🔐 Código enviado a ${user.email}. Tienes 60 segundos antes de poder reenviar.` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.from('profiles').select('otp_code').eq('id', user.id).single();
      if (error) { alert('Fallo al consultar BBDD: ' + error.message); return; }

      const codeToVerify = currentOtpRef.current;
      if (data?.otp_code === codeToVerify) {
        await supabase.from('profiles').update({ ai_verified: true, otp_code: null }).eq('id', user.id);
        setAiVerified(true);
        addMessage({ role: 'assistant', text: `🚀 ¡VERIFICASTE TU CUENTA! Permisos de IA otorgados con éxito.` });
      } else {
        alert(`Código denegado.\nEn BD: ${data?.otp_code || 'nulo'}\nTu intento: ${codeToVerify}`);
        setOtpInput('');
        currentOtpRef.current = '';
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-verificación al completar 6 dígitos
  const handleOtpInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    currentOtpRef.current = val;
    setOtpInput(val);
    if (val.length === 6) {
      setTimeout(() => handleVerifyOTP(), 200);
    }
  };

  // Ocultar si no hay usuario o en rutas de proyección
  if (!user || location.pathname.startsWith('/editor') || location.pathname.startsWith('/projector') || location.pathname.startsWith('/remote')) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all hover:scale-110"
        style={{ background: PERSONALITIES[personality].color, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)' }}
      >
        {isOpen ? '✕' : PERSONALITIES[personality].emoji}
      </button>

      {/* Overlay Oscuro */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      )}

      {/* Panel Deslizante Lateral */}
      <div className={`fixed top-0 right-0 h-full w-[350px] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col bg-neutral-900 border-l border-neutral-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="p-4 border-b border-neutral-800 shrink-0" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0d2e 100%)' }}>
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
                  <h3 className="text-sm font-black tracking-wider text-white">
                    P.A.B.L.O. <span className="text-neutral-400 font-normal text-xs">| {PERSONALITIES[personality].name}</span>
                  </h3>
                  <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-700/50 px-1.5 py-0.5 rounded-full font-bold tracking-widest">GLOBAL</span>
                </div>
                <p className="text-[9px] text-neutral-600 mt-0.5 italic flex items-center gap-1.5">
                  Tu asistente virtual
                  <span className={`font-bold not-italic px-1.5 py-0.5 rounded text-[8px] ${userCredits <= 0 ? 'bg-red-900/50 text-red-400 border border-red-700/40' :
                    userCredits <= 20 ? 'bg-amber-900/50 text-amber-400 border border-amber-700/40' :
                      'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30'
                    }`}>
                    ⚡ {userCredits} créditos
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">


              {/* Botón Historial de Chats */}
              <button
                onClick={() => setShowChatList(!showChatList)}
                title="Mis Chats"
                className={`transition-colors p-1 text-sm ${showChatList ? 'text-white' : 'text-neutral-500 hover:text-white'}`}
              >
                🗂️
              </button>
              {/* Botón Limpiar Chat Actual */}
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de limpiar los mensajes de este chat?')) {
                    updateActiveChat(c => ({ ...c, messages: [{ role: 'assistant', text: `🧹 Chat reiniciado. Cuéntame, ¿qué necesitas ahora, ${displayName}?` }] }));
                  }
                }}
                title="Limpiar Chat Actual"
                className="text-neutral-500 hover:text-amber-400 transition-colors p-1 text-sm"
              >
                🧹
              </button>
              {/* Botón Nuevo Chat */}
              <button
                onClick={handleNewChat}
                title="Nuevo Chat"
                className="text-neutral-500 hover:text-green-400 transition-colors p-1 text-sm"
              >
                ✏️
              </button>
              <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors p-1">✕</button>
            </div>
          </div>

          {/* Lista de Chats Guardados */}
          {showChatList && (
            <div className="mt-3 bg-black/60 rounded-lg border border-neutral-800 overflow-hidden">
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest px-3 py-1.5 border-b border-neutral-800">Chats recientes (máx. {MAX_CHATS})</p>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`flex items-center justify-between px-3 py-2 text-[10px] transition-colors border-b border-neutral-900/50 last:border-0 cursor-pointer
                    ${chat.id === activeChatId ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}`}
                >
                  <span className="truncate flex-1"><span className="mr-2">💬</span>{chat.title}</span>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    title="Eliminar chat"
                    className="ml-2 shrink-0 text-neutral-600 hover:text-red-400 transition-colors"
                  >🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personality Selector — componente compartido */}
        <PersonalitySelector current={personality} onChange={handlePersonalityChange} />

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar flex flex-col">
          {/* Info de sesión */}
          <div className="text-center">
            <span className="text-[8px] text-neutral-700 uppercase tracking-widest">Chat: {activeChat?.title || 'Nuevo Chat'} — {chatHistory.length}/{MAX_MESSAGES_PER_CHAT} msgs</span>
          </div>

          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
              <div className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-line relative
                ${msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'bg-neutral-800/80 text-neutral-300 border border-neutral-700/40 rounded-tl-sm'}`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
              >
                {msg.text}
                {msg.role === 'assistant' && (
                  <button
                    onClick={(e) => {
                      navigator.clipboard.writeText(msg.text);
                      const btn = e.currentTarget;
                      btn.innerText = '✅';
                      setTimeout(() => btn.innerText = '📋', 2000);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/80 hover:bg-neutral-950 text-white p-1 rounded backdrop-blur-sm text-[10px] shadow-lg border border-neutral-700/50"
                    title="Copiar mensaje"
                  >
                    📋
                  </button>
                )}
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

          {aiVerified ? (
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, MAX_INPUT_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                }}
                placeholder="Ej: Cuéntame un chiste..."
                disabled={isGenerating}
                rows={3}
                maxLength={MAX_INPUT_CHARS}
                className="w-full bg-black border border-neutral-700 rounded-lg p-3 pb-10 text-white text-xs resize-none focus:border-fuchsia-500/60 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30 disabled:opacity-50 transition-all"
              />
              <div className="absolute bottom-2 left-3 text-[9px] text-neutral-700">
                {prompt.length}/{MAX_INPUT_CHARS}
              </div>
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-30 transition-all"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                Enviar
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              {!otpSent ? (
                <button
                  onClick={handleRequestOTP}
                  disabled={isGenerating || otpCooldown > 0}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-widest transition-all"
                >
                  🔒 Solicitar Clave OTP de IA
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={otpInput}
                      onChange={handleOtpInputChange}
                      className="flex-1 bg-black border border-neutral-700 rounded-lg p-2 text-center tracking-[1em] text-white font-mono text-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleVerifyOTP}
                      disabled={isGenerating || otpInput.length < 6}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-40 px-4 text-white font-bold rounded-lg text-[10px] uppercase transition-all"
                    >
                      Verificar
                    </button>
                  </div>
                  {/* Botón Reenviar con Countdown */}
                  <button
                    onClick={handleRequestOTP}
                    disabled={otpCooldown > 0 || isGenerating}
                    className="text-[9px] text-neutral-500 hover:text-fuchsia-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                  >
                    {otpCooldown > 0
                      ? `⏱️ Reenviar en ${otpCooldown}s`
                      : '↩️ Reenviar código'}
                  </button>
                </div>
              )}
              <p className="text-[9px] text-neutral-500 text-center leading-tight">Debido a nuestras políticas anti-spam, debes verificar tu correo antes de usar al asistente P.A.B.L.O.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
