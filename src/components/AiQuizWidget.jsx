import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Llama a la Edge Function de Supabase — la API key de OpenAI vive ahí, segura
const EDGE_FN_URL = 'https://wraogfketbdpfmrpfwfb.supabase.co/functions/v1/bright-responder';
const SUPABASE_ANON_KEY = 'sb_publishable_vcJNXS9cC2QaRMlLgoXs3g_TqIokq4d';

export default function AiQuizWidget({ nasaData = {} }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const generateQuestion = useCallback(async () => {
    setLoading(true);
    setError('');
    setQuestion('');

    try {
      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ nasaData, questionCount }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      setQuestion(data.question || '¿Sin respuesta?');
      setQuestionCount(c => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [nasaData, questionCount]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!question && !loading) generateQuestion();
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        id="ai-quiz-btn"
        onClick={handleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9998]
                   w-14 h-14 rounded-full
                   bg-gradient-to-br from-fuchsia-600 to-purple-700
                   shadow-[0_0_25px_rgba(168,85,247,0.5)]
                   flex items-center justify-center
                   text-2xl border border-fuchsia-400/30
                   hover:shadow-[0_0_40px_rgba(168,85,247,0.7)]
                   transition-shadow duration-300"
        title="Lanzar pregunta IA"
      >
        🤖
      </motion.button>

      {/* Panel flotante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-[9997] w-[380px] max-w-[90vw]"
          >
            <div className="bg-black/80 backdrop-blur-2xl border border-fuchsia-500/30
                            rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.3)] overflow-hidden">

              <div className="flex items-center justify-between px-5 py-3
                              border-b border-white/10
                              bg-gradient-to-r from-fuchsia-900/40 to-purple-900/40">
                <div className="flex items-center gap-2">
                  <span className="text-fuchsia-400 text-sm">🧠</span>
                  <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-widest">
                    Pregunta IA #{questionCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-white text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-6 min-h-[120px] flex flex-col items-center justify-center">
                {loading && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-fuchsia-400 text-sm font-mono"
                  >
                    Generando pregunta...
                  </motion.div>
                )}
                {error && !loading && (
                  <p className="text-red-400 text-xs text-center">{error}</p>
                )}
                {question && !loading && (
                  <motion.p
                    key={question}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-white text-xl font-bold text-center leading-snug
                               drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    {question}
                  </motion.p>
                )}
              </div>

              <div className="px-5 pb-4 flex gap-2">
                <button
                  onClick={generateQuestion}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-sm font-bold
                             bg-fuchsia-600 hover:bg-fuchsia-500
                             disabled:opacity-40 disabled:cursor-not-allowed
                             text-white transition-colors duration-200"
                >
                  {loading ? '...' : '⚡ Nueva Pregunta'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm
                             border border-neutral-700 text-neutral-400
                             hover:border-neutral-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
