import React from 'react';
import { motion } from 'framer-motion';

// ──────────────────────────────────────────────────────────────
// Fondo por sección con overlay oscuro + efecto de entrada suave
// ──────────────────────────────────────────────────────────────
function SectionBg({ image, overlay = 'bg-black/55' }) {
  if (!image) return <div className={`absolute inset-0 z-0 bg-neutral-950 ${overlay}`} />;
  return (
    <motion.div
      initial={{ scale: 1.05 }}
      whileInView={{ scale: 1 }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
      viewport={{ once: false, amount: 0.3 }}
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className={`absolute inset-0 ${overlay}`} />
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// Capa de elementos flotantes colocados por el editor
// ──────────────────────────────────────────────────────────────
function FreeElementLayer({ elements = [], sectionId }) {
  const items = elements.filter(el => el.sectionId === sectionId);
  if (!items.length) return null;
  return (
    <>
      {items.map(el => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: el.x ?? '10%',
            top: el.y ?? '10%',
            color: el.color || '#ffffff',
            fontSize: el.fontSize ? `${el.fontSize}px` : '28px',
            fontWeight: el.fontWeight || 'bold',
            zIndex: 30,
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 2px 15px rgba(0,0,0,0.9)',
            lineHeight: 1.2,
            maxWidth: '80%',
            whiteSpace: 'pre-wrap',
          }}
        >
          {el.type === 'text' && <span>{el.content || 'Texto'}</span>}
          {el.type === 'image' && el.src && (
            <img
              src={el.src}
              alt=""
              draggable={false}
              style={{
                width: el.width ? `${el.width}px` : '200px',
                height: 'auto',
                borderRadius: el.rounded ? '12px' : '0',
                opacity: el.opacity ?? 1,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      ))}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// PLANTILLA MAESTRA — NASA/WEB INMERSIVA
// ──────────────────────────────────────────────────────────────
export default function NasaWebTemplate({ data = {} }) {
  const c = {
    heroBgImage:  data.heroBgImage  || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    aboutBgImage: data.aboutBgImage || '',
    statsBgImage: data.statsBgImage || '',
    heroTitle:    data.heroTitle    || 'PERSEVERANCE MISSION',
    heroSubtitle: data.heroSubtitle || 'Explorando las fronteras del universo desconocido.',
    aboutHeading: data.aboutHeading || 'Misión Principal',
    aboutText:    data.aboutText    || 'Un descenso hacia el cráter Jezero en busca de signos ancestrales de vida marciana.',
    features:     data.features     || [
      { id: 1, title: 'NÚCLEO RTG',       val: '100%', desc: 'Energía radioisotópica estable' },
      { id: 2, title: 'SENSÓRICA VISUAL', val: '23',   desc: 'Cámaras de ingeniería de alta densidad' },
      { id: 3, title: 'SISTEMA MOXIE',    val: 'Act',  desc: 'Generación de O² a partir de CO²' },
    ],
    freeElements: data.freeElements || [],
  };

  return (
    <div className="w-full text-white font-sans selection:bg-fuchsia-500/30">

      {/* ╔══════════════════════════════╗
          ║  SECCIÓN 1 — HERO            ║
          ╚══════════════════════════════╝ */}
      <section
        id="section-hero"
        className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      >
        <SectionBg image={c.heroBgImage} overlay="bg-black/50" />
        <FreeElementLayer elements={c.freeElements} sectionId="hero" />

        <div className="relative z-20 flex flex-col items-center text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            whileInView={{ opacity: 1, letterSpacing: '0.5em' }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            viewport={{ once: false, amount: 0.5 }}
            className="text-[10px] md:text-sm text-cyan-400 font-bold mb-6 uppercase"
          >
            ARCHIVOS CLASIFICADOS DE AGENCIA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.15, type: 'spring', damping: 18 }}
            viewport={{ once: false, amount: 0.4 }}
            className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter uppercase leading-none
                       text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 pb-4"
          >
            {c.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            viewport={{ once: false, amount: 0.5 }}
            className="text-lg md:text-2xl text-neutral-300 font-light max-w-3xl border-l-2 border-cyan-500/60 pl-6 mt-8 text-left"
          >
            {c.heroSubtitle}
          </motion.p>
        </div>

        {/* Flecha de scroll */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/30 text-2xl"
        >
          ↓
        </motion.div>
      </section>

      {/* ╔══════════════════════════════╗
          ║  SECCIÓN 2 — ABOUT           ║
          ╚══════════════════════════════╝ */}
      <section
        id="section-about"
        className="w-full min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-24"
      >
        <SectionBg image={c.aboutBgImage} overlay="bg-black/65" />
        <FreeElementLayer elements={c.freeElements} sectionId="about" />

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: false, amount: 0.25 }}
          className="relative z-20 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24"
        >
          <div className="flex flex-col justify-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-xs tracking-[0.4em] text-fuchsia-400 mb-4 font-bold uppercase"
            >
              02 // DESCRIPCIÓN
            </motion.p>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              {c.aboutHeading}
            </h2>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <p className="text-xl md:text-2xl text-neutral-300 font-light leading-relaxed">
              {c.aboutText}
            </p>
          </div>
        </motion.div>
      </section>

      {/* ╔══════════════════════════════╗
          ║  SECCIÓN 3 — STATS           ║
          ╚══════════════════════════════╝ */}
      <section
        id="section-stats"
        className="w-full min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-24"
      >
        <SectionBg image={c.statsBgImage} overlay="bg-black/70" />
        <FreeElementLayer elements={c.freeElements} sectionId="stats" />

        <div className="relative z-20 max-w-7xl w-full">
          <motion.p
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-sm tracking-[0.35em] text-neutral-500 uppercase mb-16"
          >
            {c.heroTitle} • Datos Técnicos
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {c.features.map((feat, index) => (
              <motion.div
                key={feat.id || index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: false, amount: 0.3 }}
                className="border-t-2 border-neutral-700 pt-8"
              >
                <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 mb-4 tracking-tighter">
                  {feat.val}
                </div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">{feat.title}</h3>
                <p className="text-sm text-neutral-500 font-mono uppercase leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Separador final */}
      <section className="h-[20vh] w-full flex items-center justify-center bg-black">
        <div className="w-[1px] h-20 bg-gradient-to-b from-cyan-500/40 to-transparent" />
      </section>
    </div>
  );
}
