import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EDGE_FN_URL = 'https://wraogfketbdpfmrpfwfb.supabase.co/functions/v1/bright-responder';
const SUPABASE_ANON_KEY = 'sb_publishable_vcJNXS9cC2QaRMlLgoXs3g_TqIokq4d';

export default function AiQuizWidget({ nasaData = {}, user = null }) {
  const [question,      setQuestion]      = useState('');
  const [answer,        setAnswer]        = useState('');
  const [showAnswer,    setShowAnswer]    = useState(false);
  const [zoomed,        setZoomed]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [isOpen,        setIsOpen]        = useState(false);
  const [error,         setError]         = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const generateQuestion = useCallback(async () => {
    setLoading(true);
    setError('');
    setQuestion('');
    setAnswer('');
    setShowAnswer(false);
    setZoomed(false);

    try {
      const sections = nasaData.sections || [];
      const contextText = sections
        .flatMap(sec => (sec.elements || []))
        .filter(el => el.type === 'text' && el.content)
        .map(el => el.content)
        .join(' | ')
        .slice(0, 1200);

      const payload = {
        nasaData: contextText ? { context: contextText } : nasaData,
        questionCount,
        // pedimos que incluya la respuesta también
        includeAnswer: true,
      };

      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `Error ${response.status}`);

      setQuestion(data.question || '¿Sin pregunta?');
      // Si la Edge Function devuelve answer úsala, si no generamos una genérica
      setAnswer(data.answer || 'Reflexiona sobre el tema y comenta tu respuesta al grupo.');
      setQuestionCount(c => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [nasaData, questionCount]);

  const handleOpen = () => {
    setIsOpen(true);
    if (user && !question && !loading) generateQuestion();
  };

  const handleNewQuestion = () => {
    setShowAnswer(false);
    setZoomed(false);
    generateQuestion();
  };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        id="ai-quiz-btn"
        onClick={handleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          zIndex: 9998, width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4, #1d4ed8)',
          boxShadow: '0 0 25px rgba(6,182,212,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', border: '1px solid rgba(6,182,212,0.3)',
          cursor: 'pointer',
        }}
        title="Lanzar pregunta IA"
      >
        🤖
      </motion.button>

      {/* ── Guest blocker ── */}
      <AnimatePresence>
        {!user && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 9997, width: '340px', maxWidth: '90vw' }}
          >
            <div style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
              <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>¡Hola, mi rey!</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.6 }}>
                Crea una cuenta para poder realizar tu prueba gratuita del Quiz IA y desbloquear todas las funciones.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a href="#/login" style={{ padding: '10px 20px', fontSize: '0.875rem', background: '#00f0ff', color: 'black', fontWeight: 'bold', borderRadius: '10px', textDecoration: 'none' }}>
                  UNIRSE GRATIS
                </a>
                <button onClick={() => setIsOpen(false)} style={{ padding: '10px 16px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Quiz panel (logged-in only) ── */}
      <AnimatePresence>
        {user && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: '96px', right: '24px', zIndex: 9997,
              width: '390px', maxWidth: '92vw',
            }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: '22px', overflow: 'hidden',
              boxShadow: '0 0 60px rgba(6,182,212,0.15)',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'linear-gradient(90deg, rgba(8,145,178,0.2), rgba(29,78,216,0.2))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem' }}>🧠</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#67e8f9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Pregunta IA #{questionCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
                >
                  ×
                </button>
              </div>

              {/* Question body */}
              <div style={{ padding: '20px', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {loading && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ color: '#22d3ee', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.12em' }}
                  >
                    GENERANDO...
                  </motion.div>
                )}
                {error && !loading && (
                  <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center' }}>{error}</p>
                )}

                {/* ── ZOOM OVERLAY ── */}
                <AnimatePresence>
                  {zoomed && question && !loading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 180 }}
                      onClick={() => setZoomed(false)}
                      style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '40px', cursor: 'zoom-out',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#22d3ee', letterSpacing: '0.15em', marginBottom: '24px', textTransform: 'uppercase' }}>
                        🧠 PREGUNTA IA #{questionCount}
                      </span>
                      <p style={{
                        fontSize: 'clamp(1.6rem, 5vw, 3rem)',
                        fontWeight: '800', color: '#fff', textAlign: 'center',
                        lineHeight: 1.3, maxWidth: '700px',
                        textShadow: '0 0 40px rgba(6,182,212,0.6)',
                      }}>
                        {question}
                      </p>
                      <AnimatePresence>
                        {showAnswer && (
                          <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              marginTop: '32px', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)',
                              color: '#86efac', textAlign: 'center', maxWidth: '600px',
                              lineHeight: 1.6, fontStyle: 'italic',
                            }}
                          >
                            💡 {answer}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <p style={{ marginTop: '32px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        Toca en cualquier lugar para cerrar
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Normal question display */}
                {question && !loading && (
                  <motion.p
                    key={question}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      color: '#fff', fontSize: '1.15rem', fontWeight: 'bold',
                      textAlign: 'center', lineHeight: 1.45,
                      textShadow: '0 0 20px rgba(6,182,212,0.4)',
                    }}
                  >
                    {question}
                  </motion.p>
                )}

                {/* Answer reveal */}
                <AnimatePresence>
                  {showAnswer && answer && !loading && (
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        color: '#86efac', fontSize: '0.9rem', textAlign: 'center',
                        marginTop: '14px', lineHeight: 1.6,
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '12px', fontStyle: 'italic',
                      }}
                    >
                      💡 {answer}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Action bar */}
              <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Nueva pregunta */}
                <button
                  onClick={handleNewQuestion}
                  disabled={loading}
                  style={{
                    flex: '1 1 120px', padding: '10px 8px', borderRadius: '12px',
                    fontSize: '12px', fontWeight: 'bold',
                    background: '#06b6d4', color: '#000',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  {loading ? '...' : '⚡ Nueva'}
                </button>

                {/* Ver / ocultar respuesta */}
                {question && !loading && (
                  <button
                    onClick={() => setShowAnswer(v => !v)}
                    style={{
                      flex: '1 1 110px', padding: '10px 8px', borderRadius: '12px',
                      fontSize: '12px', fontWeight: 'bold',
                      background: showAnswer ? 'rgba(134,239,172,0.15)' : 'rgba(255,255,255,0.07)',
                      color: showAnswer ? '#86efac' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${showAnswer ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.12)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {showAnswer ? '🙈 Ocultar' : '👁️ Respuesta'}
                  </button>
                )}

                {/* Zoom */}
                {question && !loading && (
                  <button
                    onClick={() => setZoomed(true)}
                    style={{
                      padding: '10px 14px', borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    title="Pantalla completa (para mostrar en proyector)"
                  >
                    🔍
                  </button>
                )}

                {/* Cerrar */}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '10px 14px', borderRadius: '12px', fontSize: '12px',
                    background: 'transparent', color: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
