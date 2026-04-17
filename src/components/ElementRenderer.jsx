import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ── Text ─────────────────────────────────────────────────────────────────────
export function TextContent({ el, editing = false, onContentChange }) {
  const s = el.style || {};
  return (
    <div
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={editing ? (e) => onContentChange?.(e.currentTarget.innerText) : undefined}
      style={{
        width: '100%', height: '100%',
        fontSize: s.fontSize ? `${s.fontSize}px` : '28px',
        fontWeight: s.fontWeight || 'normal',
        color: s.color || '#ffffff',
        textAlign: s.textAlign || 'left',
        opacity: s.opacity ?? 1,
        lineHeight: 1.25,
        cursor: editing ? 'text' : 'default',
        outline: 'none',
        overflow: 'visible',
        textShadow: '0 2px 20px rgba(0,0,0,0.9)',
        userSelect: editing ? 'text' : 'none',
        fontFamily: s.fontFamily || 'inherit',
        textTransform: s.textTransform || 'none',
        letterSpacing: s.letterSpacing || 'normal',
        fontStyle: s.italic ? 'italic' : 'normal',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {el.content || 'Texto'}
    </div>
  );
}

// ── Image ─────────────────────────────────────────────────────────────────────
export function ImageContent({ el }) {
  const s = el.style || {};
  if (!el.src) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', border: '2px dashed #444', borderRadius: '8px',
        color: '#555', fontSize: '11px', textAlign: 'center', padding: '8px',
      }}>
        🖼️ Pega URL en el inspector →
      </div>
    );
  }
  return (
    <img src={el.src} alt="" draggable={false} style={{
      width: '100%', height: '100%',
      objectFit: s.objectFit || 'cover',
      opacity: s.opacity ?? 1,
      borderRadius: `${s.borderRadius || 0}px`,
      boxShadow: s.shadow ? '0 20px 60px rgba(0,0,0,0.7)' : 'none',
      pointerEvents: 'none',
    }} />
  );
}

// ── Metric ────────────────────────────────────────────────────────────────────
export function MetricContent({ el }) {
  const s = el.style || {};
  return (
    <div style={{
      color: s.color || '#fff', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      paddingTop: '14px', borderTop: '2px solid rgba(255,255,255,0.15)',
    }}>
      <div style={{
        fontSize: `${s.fontSize || 64}px`,
        fontWeight: '900', lineHeight: 1, letterSpacing: '-0.02em',
        background: 'linear-gradient(to bottom, #ffffff, #888888)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {el.val || '?'}
      </div>
      <div style={{
        fontSize: '13px', fontWeight: '700', color: '#22d3ee',
        marginTop: '8px', letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        {el.title || 'MÉTRICA'}
      </div>
      <div style={{
        fontSize: '11px', color: '#6b7280', fontFamily: 'monospace',
        textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em',
      }}>
        {el.desc || ''}
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export function TimelineContent({ el }) {
  const items = el.items || [];
  const accentColor = el.style?.color || '#22d3ee';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0' }}>
      {el.title && (
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {el.title}
        </div>
      )}
      <div style={{ position: 'relative', paddingLeft: '28px' }}>
        {/* Vertical line */}
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: '100%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          viewport={{ once: false }}
          style={{
            position: 'absolute', left: '8px', top: 0,
            width: '2px', background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
          }}
        />
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            viewport={{ once: false, amount: 0.3 }}
            style={{ marginBottom: i < items.length - 1 ? '20px' : 0, position: 'relative' }}
          >
            {/* Node dot */}
            <div style={{
              position: 'absolute', left: '-24px', top: '4px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 12px ${accentColor}`,
              border: '2px solid rgba(0,0,0,0.6)',
            }} />
            <div style={{ fontSize: '11px', fontWeight: '800', color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {item.year || item.date || ''}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
              {item.title || ''}
            </div>
            {item.desc && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Comparison (Tech Grid) ────────────────────────────────────────────────────
export function ComparisonContent({ el }) {
  const columns = el.columns || [];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: '12px', alignItems: 'stretch' }}>
      {columns.map((col, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, duration: 0.6 }}
          viewport={{ once: false }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${col.color || 'rgba(255,255,255,0.1)'}33`,
            borderRadius: '14px', padding: '18px', overflow: 'hidden',
          }}
        >
          <div style={{
            fontSize: '16px', fontWeight: '800', color: col.color || '#fff',
            marginBottom: '12px', letterSpacing: '-0.02em',
            borderBottom: `2px solid ${col.color || 'rgba(255,255,255,0.15)'}`,
            paddingBottom: '8px',
          }}>
            {col.title || `Opción ${i + 1}`}
          </div>
          {(col.items || []).map((item, j) => (
            <div key={j} style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.7)',
              padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              lineHeight: 1.4,
            }}>
              {item}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ── Formula (KaTeX) ───────────────────────────────────────────────────────────
export function FormulaContent({ el }) {
  const ref = useRef(null);
  const formula = el.content || 'E = mc^2';
  const label = el.label || '';

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, {
          displayMode: true, throwOnError: false,
          output: 'html',
        });
      } catch {
        ref.current.textContent = formula;
      }
    }
  }, [formula]);

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div
        ref={ref}
        style={{
          fontSize: `${el.style?.fontSize || 32}px`,
          color: el.style?.color || '#ffffff',
          filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.3))',
        }}
      />
      {label && (
        <div style={{
          fontSize: '12px', color: 'rgba(255,255,255,0.4)',
          marginTop: '10px', fontStyle: 'italic', letterSpacing: '0.04em',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Code Terminal ─────────────────────────────────────────────────────────────
export function CodeContent({ el }) {
  const lang = el.language || 'python';
  const code = el.content || '# Tu código aquí';
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0d1117', borderRadius: '12px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* macOS titlebar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          {lang}
        </span>
      </div>
      {/* Code body */}
      <pre style={{
        flex: 1, margin: 0, padding: '16px',
        fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
        fontSize: `${el.style?.fontSize || 14}px`,
        color: '#e6edf3', lineHeight: 1.6,
        overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        tabSize: 4,
      }}>
        {code}
      </pre>
    </div>
  );
}

// ── Bento Grid ────────────────────────────────────────────────────────────────
export function BentoContent({ el }) {
  const items = el.items || [];
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridAutoRows: 'minmax(80px, auto)',
      gap: '10px',
    }}>
      {items.map((item, i) => {
        const isLarge = item.size === 'large';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            viewport={{ once: false }}
            style={{
              gridColumn: isLarge ? 'span 2' : 'span 1',
              gridRow: isLarge ? 'span 2' : 'span 1',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '18px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              position: 'relative', overflow: 'hidden',
              transition: 'box-shadow 0.3s',
            }}
          >
            {item.icon && (
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
            )}
            <div style={{ fontSize: isLarge ? '16px' : '13px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {item.title || `Item ${i + 1}`}
            </div>
            {item.desc && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Counter (Animated Number) ─────────────────────────────────────────────────
export function CounterContent({ el }) {
  const targetVal = parseInt(el.val) || 0;
  const suffix = el.suffix || '';
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const start = performance.now();
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(eased * targetVal));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
        if (!entry.isIntersecting) setHasAnimated(false);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetVal, hasAnimated]);

  return (
    <div ref={ref} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        fontSize: `${el.style?.fontSize || 96}px`,
        fontWeight: '900', lineHeight: 1, letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, #ffffff, #22d3ee)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textShadow: 'none',
      }}>
        {count}{suffix}
      </div>
      {el.title && (
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#22d3ee', marginTop: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {el.title}
        </div>
      )}
      {el.desc && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          {el.desc}
        </div>
      )}
    </div>
  );
}

// ── Blockquote ────────────────────────────────────────────────────────────────
export function BlockquoteContent({ el }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      position: 'relative', padding: '16px',
    }}>
      {/* Giant watermark quotes */}
      <div style={{
        position: 'absolute', top: '-10px', left: '0',
        fontSize: '140px', fontWeight: '900', color: 'rgba(255,255,255,0.04)',
        lineHeight: 1, fontFamily: 'Georgia, serif', pointerEvents: 'none',
      }}>
        "
      </div>
      <div style={{
        position: 'absolute', bottom: '-40px', right: '0',
        fontSize: '140px', fontWeight: '900', color: 'rgba(255,255,255,0.04)',
        lineHeight: 1, fontFamily: 'Georgia, serif', pointerEvents: 'none',
        transform: 'rotate(180deg)',
      }}>
        "
      </div>
      {/* Quote text */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false }}
        style={{
          fontSize: `${el.style?.fontSize || 28}px`,
          fontStyle: 'italic', color: el.style?.color || '#ffffff',
          fontWeight: '400', lineHeight: 1.5, maxWidth: '90%',
          margin: 0, position: 'relative', zIndex: 1,
        }}
      >
        {el.content || '"Una cita inspiradora aquí."'}
      </motion.p>
      {el.author && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          viewport={{ once: false }}
          style={{
            fontSize: '13px', color: '#22d3ee', fontWeight: '600',
            marginTop: '14px', letterSpacing: '0.1em', textTransform: 'uppercase',
            position: 'relative', zIndex: 1,
          }}
        >
          — {el.author}
        </motion.p>
      )}
    </div>
  );
}

// ── Projector element (animated, absolute positioned) ─────────────────────────
export function ProjectorElement({ el }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      viewport={{ once: false, amount: 0.15 }}
      style={{
        position: 'absolute',
        left: `${el.x}%`, top: `${el.y}%`,
        width: `${el.w}%`, height: `${el.h}%`,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 20,
      }}
    >
      {el.type === 'text'       && <TextContent el={el} />}
      {el.type === 'image'      && <ImageContent el={el} />}
      {el.type === 'metric'     && <MetricContent el={el} />}
      {el.type === 'timeline'   && <TimelineContent el={el} />}
      {el.type === 'comparison' && <ComparisonContent el={el} />}
      {el.type === 'formula'    && <FormulaContent el={el} />}
      {el.type === 'code'       && <CodeContent el={el} />}
      {el.type === 'bento'      && <BentoContent el={el} />}
      {el.type === 'counter'    && <CounterContent el={el} />}
      {el.type === 'blockquote' && <BlockquoteContent el={el} />}
    </motion.div>
  );
}
