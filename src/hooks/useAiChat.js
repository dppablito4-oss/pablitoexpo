/**
 * useAiChat.js — Hook compartido para la lógica de chat con P.A.B.L.O.
 *
 * Elimina la duplicación masiva (~70%) entre GlobalAiCopilot y AiCopilotPanel.
 * Ambos componentes ahora importan este hook y solo se encargan de su UI particular.
 *
 * Lo que maneja este hook:
 * - Estado del chat (prompt, isGenerating, verbosity, personality)
 * - Créditos y verificación OTP desde el perfil de Supabase
 * - Persistencia de personalidad en DB
 * - Deducción de HP antes de cada llamada a la IA
 * - Auto-scroll al último mensaje
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { deductHP } from '../lib/xpService';
import PERSONALITIES from '../config/personalities';

const MAX_INPUT_CHARS = 500;

export default function useAiChat({ mode = 'global', initialMessage = '', currentSections = null }) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuario';

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [verbosity, setVerbosity] = useState('short');
  const [personality, setPersonality] = useState('brayan');
  const [aiVerified, setAiVerified] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: initialMessage || `¡Hola, ${displayName.toUpperCase()}! Soy P.A.B.L.O., tu asistente virtual. Selecciona una personalidad y charlemos.` }
  ]);

  const endOfMessagesRef = useRef(null);
  const messageCountRef = useRef(0);

  // ── Load profile state from Supabase ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const loadState = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('ai_personality, ai_verified, ai_credits')
        .eq('id', user.id)
        .single();
      if (data?.ai_personality) setPersonality(data.ai_personality);
      if (data) {
        setAiVerified(!!data.ai_verified);
        if (data.ai_credits !== undefined) setUserCredits(data.ai_credits);
      }
    };
    loadState();
  }, [user?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGenerating]);

  // ── Add message to chat ───────────────────────────────────────────────────
  const addMessage = useCallback((msg) => {
    setChatHistory(prev => [...prev, msg]);
  }, []);

  // ── Change personality ────────────────────────────────────────────────────
  const handlePersonalityChange = useCallback(async (newP) => {
    setPersonality(newP);
    if (user?.id) {
      await supabase.from('profiles').update({ ai_personality: newP }).eq('id', user.id);
    }
    addMessage({ role: 'assistant', text: `*Personalidad cambiada a ${PERSONALITIES[newP].name} ${PERSONALITIES[newP].emoji}*` });
  }, [user?.id, addMessage]);

  // ── Submit prompt ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!prompt.trim() || isGenerating) return;

    const userText = prompt.trim().slice(0, MAX_INPUT_CHARS);
    setPrompt('');
    addMessage({ role: 'user', text: userText });
    setIsGenerating(true);

    messageCountRef.current += 1;
    const shouldProfile = (messageCountRef.current % 5 === 0);

    try {
      // ⚡ Verificar y descontar créditos
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

      const body = {
        prompt: userText,
        verbosity,
        personality,
        username: displayName,
        chatHistory: historyPayload,
        mode,
      };

      // El copiloto del editor envía las secciones y shouldProfile
      if (currentSections) {
        body.currentSections = currentSections;
        body.shouldProfile = shouldProfile;
      }

      const { data, error } = await supabase.functions.invoke('pablito-copilot', { body });

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
      addMessage({ role: 'assistant', text: `❌ P.A.B.L.O. tuvo un error: ${err.message}.\n\nInténtalo de nuevo.` });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, personality, verbosity, user?.id, displayName, chatHistory, currentSections, mode, addMessage]);

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    setChatHistory([{ role: 'assistant', text: `🧹 Chat reiniciado. Cuéntame, ¿qué necesitas ahora, ${displayName}?` }]);
  }, [displayName]);

  return {
    // State
    prompt, setPrompt,
    isGenerating,
    verbosity, setVerbosity,
    personality,
    aiVerified,
    userCredits,
    chatHistory,
    displayName,
    // Refs
    endOfMessagesRef,
    // Actions
    handlePersonalityChange,
    handleSubmit,
    addMessage,
    clearChat,
    // Constants
    MAX_INPUT_CHARS,
  };
}
