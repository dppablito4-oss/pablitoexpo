import React from 'react';
import { motion } from 'framer-motion';

export default function ComparisonSlide({ data }) {
  const stats = data?.stats || [
    { label: "Ejemplo 1", valA: 80, valB: 30 }
  ];

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col justify-center p-12 text-white overflow-hidden">
      <div className="max-w-5xl w-full mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end mb-16 border-b border-neutral-800 pb-8"
        >
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-blue-500 w-2/5 break-words">
            {data.conceptA || "Concepto Izquierdo"}
          </h2>
          <span className="text-3xl font-mono text-neutral-600 px-6 font-bold">VS</span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-purple-500 text-right w-2/5 break-words">
            {data.conceptB || "Concepto Derecho"}
          </h2>
        </motion.div>

        <div className="space-y-10">
          {stats.map((stat, i) => (
            <div key={i} className="relative">
              <div className="flex justify-center text-lg font-bold text-neutral-200 mb-4 tracking-widest relative z-10 drop-shadow-md">
                <span>{stat.label}</span>
              </div>
              <div className="flex h-10 rounded-full bg-neutral-900/80 overflow-hidden shadow-inner border border-neutral-800/50">
                {/* Barra A */}
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stat.valA}%` }}
                  transition={{ duration: 1.2, delay: i * 0.15, type: "spring", damping: 12 }}
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full relative"
                >
                  <span className="absolute right-4 top-2 text-sm font-bold shadow-black">{stat.valA}%</span>
                </motion.div>
                
                {/* Barra B */}
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stat.valB}%` }}
                  transition={{ duration: 1.2, delay: i * 0.15, type: "spring", damping: 12 }}
                  className="bg-gradient-to-l from-purple-600 to-purple-400 h-full relative ml-auto flex justify-end"
                >
                  <span className="absolute left-4 top-2 text-sm font-bold shadow-black">{stat.valB}%</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
