import { useState, useEffect } from 'react';

/**
 * useIsMobile — Hook reutilizable para detectar dispositivos móviles.
 *
 * @param {number} breakpoint — Ancho máximo en px para considerar "mobile" (default: 640)
 * @returns {boolean} true si el viewport es menor al breakpoint
 */
export default function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isMobile;
}
