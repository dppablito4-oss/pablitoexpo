import React from 'react';
import { motion } from 'framer-motion';
import { generateAnimation } from '../lib/animations';

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

const textVars = {
  hidden: { opacity: 0, y: 50 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

export default function HeroSlide({ config = {}, data = {} }) {
  const anim = generateAnimation(config?.family, config?.direction, config?.physics);

  return (
    <motion.div 
      {...anim}
      className="absolute inset-0 w-full h-full bg-transparent flex flex-col justify-center items-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center px-6 max-w-4xl"
      >
        <div className="overflow-hidden mb-8">
          <motion.h1 
            variants={textVars}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
          >
            {data.title || "Tu Título Épico Aquí"}
          </motion.h1>
        </div>
        
        <div className="overflow-hidden">
          <motion.p 
            variants={textVars}
            className="text-xl md:text-3xl text-neutral-400 font-light"
          >
            {data.subtitle || "Añade un subtítulo desde el panel lateral de tu editor para darle vida a esta portada."}
          </motion.p>
        </div>

        {data.buttonText && (
          <motion.div variants={textVars} className="mt-12">
            <button className="px-8 py-3 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm">
              {data.buttonText}
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
