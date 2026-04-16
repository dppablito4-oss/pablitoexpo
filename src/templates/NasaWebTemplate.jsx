import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function NasaWebTemplate({ data = {} }) {
  // Configuración de datos por defecto (inyectable desde Editor)
  const content = {
    heroTitle: data.heroTitle || "PERSEVERANCE MISSION",
    heroSubtitle: data.heroSubtitle || "Explorando las fronteras del universo desconocido.",
    aboutHeading: data.aboutHeading || "Misión Principal",
    aboutText: data.aboutText || "Un descenso hacia el cráter Jezero en busca de signos ancestrales de vida marciana y recolectando rocas para el futuro de la humanidad.",
    features: data.features || [
      { id: 1, title: "NÚCLEO RTG", val: "100%", desc: "Energía radioisotópica estable" },
      { id: 2, title: "SENSÓRICA VISUAL", val: "23", desc: "Cámaras de ingeniería de alta densidad" },
      { id: 3, title: "SISTEMA MOXIE", val: "Act", desc: "Generación de oxígeno a partir de CO2" }
    ],
    bgImage: data.bgImage || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
  };

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.5], [0, -150]);

  return (
    <div className="w-full text-white font-sans selection:bg-fuchsia-500/30">
        {/* PARALLAX ESTELAR GLOBAL */}
        <div className="fixed inset-0 z-0 bg-neutral-950">
            <motion.div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
                style={{ backgroundImage: `url(${content.bgImage})`, y: heroY }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-neutral-950/80 to-black/90"></div>
        </div>

        <div className="relative z-10">
            
            {/* --- SECCIÓN 1: HERO EPIC --- */}
            <section id="section-hero" className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
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
                        className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter uppercase leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] mix-blend-overlay text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 pb-4"
                    >
                        {content.heroTitle}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.6 }}
                        className="text-lg md:text-2xl text-neutral-400 font-light max-w-3xl border-l-2 border-cyan-500/50 pl-6 mt-8"
                    >
                        {content.heroSubtitle}
                    </motion.p>
                </motion.div>
            </section>

            {/* --- SECCIÓN 2: ABOUT / GLASSMORPHISM --- */}
            <section id="section-about" className="w-full min-h-screen flex items-center justify-center px-6 py-24 relative">
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
                            </span> <br/>
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

            {/* --- SECCIÓN 3: STATS / ASIMÉTRICA --- */}
            <section id="section-stats" className="w-full min-h-screen flex items-center justify-center px-6 py-24 relative bg-black/40">
                <div className="max-w-7xl w-full">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="mb-16"
                    >
                        <h2 className="text-sm tracking-[0.3em] text-neutral-500 uppercase">{content.heroTitle} • Datos Técnicos</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                        {content.features.map((feat, index) => (
                            <motion.div 
                                key={feat.id || index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                className="border-t border-neutral-800 pt-8"
                            >
                                <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-800 mb-4 tracking-tighter">
                                    {feat.val}
                                </div>
                                <h3 className="text-xl font-bold text-cyan-400 mb-2">{feat.title}</h3>
                                <p className="text-sm text-neutral-500 font-mono uppercase">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* END BUFFER */}
            <section className="h-[30vh] w-full flex items-center justify-center">
                 <div className="w-[1px] h-32 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
            </section>
        </div>
    </div>
  );
}
