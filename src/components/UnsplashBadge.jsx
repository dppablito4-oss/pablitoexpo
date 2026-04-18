import React, { useState, useRef, useEffect } from 'react';

export default function UnsplashBadge({ credit }) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  // Auto-collapse if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!credit) return null;

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded(prev => !prev)}
      className={`absolute bottom-3 right-3 flex items-center gap-2 overflow-hidden
                  rounded-md transition-all duration-300 z-[100] pointer-events-auto
                  ${expanded ? 'bg-black/40 backdrop-blur-md px-2.5 py-1.5 opacity-100 max-w-xs' : 'bg-transparent p-1 opacity-30 hover:opacity-100 max-w-[28px]'}`}
      style={{ cursor: 'pointer' }}
    >
      {/* Unsplash Logo SVG */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 32 32"
        fill="#ffffff"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path>
      </svg>

      {/* Credit Text - Expands on hover/touch */}
      <div 
        className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`} 
        onClick={(e) => {
          if (!expanded) { 
             e.preventDefault(); // Primer toque expande, no linkea
             return; 
          }
          e.stopPropagation(); // Evitar que el click cierre el contenedor
        }}
      >
        <span className="text-[10px] text-white/70">Foto por </span>
        <a
          href={`https://unsplash.com/@${credit.username}?utm_source=pablito_expo&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white font-bold hover:underline"
        >
          {credit.name}
        </a>
        <span className="text-[10px] text-white/70"> en </span>
        <a
          href="https://unsplash.com/?utm_source=pablito_expo&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white font-bold hover:underline"
        >
          Unsplash
        </a>
      </div>
    </div>
  );
}
