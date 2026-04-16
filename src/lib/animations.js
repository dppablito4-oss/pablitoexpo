// 1. DICCIONARIO DE FÍSICAS (Easings)
export const PHYSICS = {
  snappy: { type: "spring", stiffness: 300, damping: 20 },
  bouncy: { type: "spring", stiffness: 150, damping: 10, mass: 1.2 },
  smooth: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // Apple style
  linear: { duration: 0.5, ease: "linear" }
};

// 2. FUNCIÓN GENERADORA
export const generateAnimation = (family = 'fade', direction = 'up', physicsType = 'smooth') => {
  const transition = PHYSICS[physicsType] || PHYSICS.smooth;
  
  // Distancias de entrada/salida basadas en dirección
  const offset = 100;
  const dirMap = {
    up: { y: offset, x: 0 },
    down: { y: -offset, x: 0 },
    left: { x: offset, y: 0 },
    right: { x: -offset, y: 0 },
    none: { x: 0, y: 0 }
  };
  
  const initialPos = dirMap[direction] || dirMap.none;
  const exitPos = { 
    x: initialPos.x * -0.5, // Sale hacia el lado contrario, pero menos distancia
    y: initialPos.y * -0.5 
  };

  // 3. FAMILIAS BASE
  const FAMILIES = {
    "fade": {
      initial: { opacity: 0 },
      whileInView: { opacity: 1, transition },
      exit: { opacity: 0, transition: { duration: 0.3 } }
    },
    "slide": {
      initial: { opacity: 0, x: initialPos.x, y: initialPos.y },
      whileInView: { opacity: 1, x: 0, y: 0, transition },
      exit: { opacity: 0, x: exitPos.x, y: exitPos.y, transition: { duration: 0.3 } }
    },
    "blur-slide": {
      initial: { opacity: 0, filter: "blur(15px)", x: initialPos.x, y: initialPos.y },
      whileInView: { opacity: 1, filter: "blur(0px)", x: 0, y: 0, transition },
      exit: { opacity: 0, filter: "blur(5px)", transition: { duration: 0.3 } }
    },
    "scale-up": {
      initial: { opacity: 0, scale: 0.8, x: initialPos.x, y: initialPos.y },
      whileInView: { opacity: 1, scale: 1, x: 0, y: 0, transition },
      exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
    },
    "glitch": { // El glitch ignora la dirección
      initial: { opacity: 0, x: -20, skewX: "20deg" },
      whileInView: { opacity: 1, x: 0, skewX: "0deg", transition: PHYSICS.snappy },
      exit: { opacity: 0, x: 20, skewX: "-20deg", transition: { duration: 0.2 } }
    }
  };

  const familyProps = FAMILIES[family] || FAMILIES["fade"];
  
  // Agregamos el comportamiento del viewport
  return {
      ...familyProps,
      viewport: { once: false, amount: 0.2 } // Re-anima al hacer scroll hacia atrás
  };
};
