import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Cpu, Activity, Star, Rocket } from 'lucide-react';

const iconMap = {
  zap: <Zap className="w-8 h-8 text-yellow-400" />,
  shield: <Shield className="w-8 h-8 text-blue-400" />,
  cpu: <Cpu className="w-8 h-8 text-purple-400" />,
  activity: <Activity className="w-8 h-8 text-emerald-400" />,
  star: <Star className="w-8 h-8 text-amber-400" />,
  rocket: <Rocket className="w-8 h-8 text-red-500" />
};

const gridVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVars = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function FeatureGrid({ data }) {
  const features = data?.features || [
    { id: 1, title: "Característica Uno", desc: "Descripción detallada", icon: "zap" },
    { id: 2, title: "Característica Dos", desc: "Otra descripción", icon: "shield" }
  ];

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col justify-center items-center p-12 overflow-hidden">
      <div className="max-w-6xl w-full">
        <motion.h2 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-12 border-l-4 border-emerald-500 pl-6"
        >
          {data.heading || "Puntos Clave del Tema"}
        </motion.h2>

        <motion.div 
          variants={gridVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((feat) => (
            <motion.div 
              key={feat.id}
              variants={cardVars}
              whileHover={{ y: -5, backgroundColor: "rgba(38, 38, 38, 0.8)", scale: 1.02 }}
              className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl backdrop-blur-md cursor-default transition-all"
            >
              <div className="mb-6 bg-black/40 w-16 h-16 rounded-xl flex items-center justify-center border border-neutral-700/50 shadow-xl">
                {iconMap[feat.icon] || <Star className="w-8 h-8 text-neutral-500" />}
              </div>
              <h3 className="text-2xl font-semibold text-neutral-100 mb-3">{feat.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-lg">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
