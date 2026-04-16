import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Renders free-floating elements (text/images) placed by the editor
function FreeElementLayer({ elements = [], sectionId }) {
  const sectionElements = elements.filter(el => el.sectionId === sectionId);
  if (!sectionElements.length) return null;

  return (
    <>
      {sectionElements.map(el => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: el.x ?? '10%',
            top: el.y ?? '10%',
            color: el.color || '#ffffff',
            fontSize: el.fontSize ? `${el.fontSize}px` : '28px',
            fontWeight: el.fontWeight || 'bold',
            fontFamily: el.fontFamily || 'inherit',
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
              style={{
                width: el.width ? `${el.width}px` : '200px',
                height: 'auto',
                borderRadius: el.rounded ? '12px' : '0',
                opacity: el.opacity ?? 1,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              }}
            />
          )}
        </div>
      ))}
    </>
  );
}

export default function NasaWebTemplate({ data = {} }) {
  const content = {
    heroTitle:    data.heroTitle    || "PERSEVERANCE MISSION",
    heroSubtitle: data.heroSubtitle || "Explorando las fronteras del universo desconocido.",
    aboutHeading: data.aboutHeading || "Misión Principal",
    aboutText:    data.aboutText    || "Un descenso hacia el cráter Jezero en busca de signos ancestrales de vida marciana.",
    features:     data.features     || [
      { id: 1, title: "NÚCLEO RTG",      val: "100%", desc: "Energía radioisotópica estable" },
      { id: 2, title: "SENSÓRICA VISUAL",val: "23",   desc: "Cámaras de ingeniería de alta densidad" },
      { id: 3, title: "SISTEMA MOXIE",   val: "Act",  desc: "Generación de oxígeno a partir de CO2" }
    ],
    bgImage:      data.bgImage || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    freeElements: data.freeElements || [],
  };

  const { scrollYProgress } = useScroll();
  const heroOpacity   = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  return (
    <div className="w-full text-white font-sans selection:bg-fuchsia-500/30">

      {/* FONDO FIJO — bg-attachment: fixed vía inline para evitar que se desplace */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${content.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',   // ← Fondo anclado al viewport, no a la página
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-neutral-950/60 to-black" />
      </div>

      <div className="relative z-10">

        {/* ── SECCIÓN 1: HERO ── */}
        <section
          id="section-hero"
          className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
        >
          <FreeElementLayer elements={content.freeElements} sectionId="hero" />

          <motion.div
            style={{ y: heroParallaxY, opacity: heroOpacity }}
            className="flex flex-col items-center text-center max-w-6xl mx-auto -mt-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-[10px] md:text-sm tracking-[0.5em] text-cyan-400 font-bold mb-6 uppercase"
            >
              ARCHIVOS CLASIFICADOS DE AGENCIA
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", damping: 20 }}
              className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter uppercase leading-none
                         text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 pb-4"
            >
              {content.heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.6 }}
              className="text-lg md:text-2xl text-neutral-300 font-light max-w-3xl border-l-2 border-cyan-500/50 pl-6 mt-8"
            >
              {content.heroSubtitle}
            </motion.p>
          </motion.div>
        </section>

        {/* ── SECCIÓN 2: ABOUT / GLASSMORPHISM ── */}
        <section
          id="section-about"
          className="w-full min-h-screen flex items-center justify-center px-6 py-24 relative"
        >
          <FreeElementLayer elements={content.freeElements} sectionId="about" />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-20%" }}
            transition={{ duration: 1 }}
            className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24"
          >
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">
                  01 //
                </span>
                <br />
                {content.aboutHeading}
              </h2>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <p className="text-xl md:text-3xl text-neutral-300 font-light leading-relaxed">
                {content.aboutText}
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── SECCIÓN 3: STATS ── */}
        <section
          id="section-stats"
          className="w-full min-h-screen flex items-center justify-center px-6 py-24 relative bg-black/30"
        >
          <FreeElementLayer elements={content.freeElements} sectionId="stats" />

          <div className="max-w-7xl w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="mb-16"
            >
              <h2 className="text-sm tracking-[0.3em] text-neutral-500 uppercase">
                {content.heroTitle} • Datos Técnicos
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {content.features.map((feat, index) => (
                <motion.div
                  key={feat.id || index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="border-t border-neutral-700 pt-8"
                >
                  <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 mb-4 tracking-tighter">
                    {feat.val}
                  </div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">{feat.title}</h3>
                  <p className="text-sm text-neutral-500 font-mono uppercase">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Separador final */}
        <section className="h-[30vh] w-full flex items-center justify-center">
          <div className="w-[1px] h-32 bg-gradient-to-b from-cyan-500/50 to-transparent" />
        </section>
      </div>
    </div>
  );
}
