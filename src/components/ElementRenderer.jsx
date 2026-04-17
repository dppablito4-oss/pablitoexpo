import { motion } from 'framer-motion';

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
      {el.type === 'text'   && <TextContent el={el} />}
      {el.type === 'image'  && <ImageContent el={el} />}
      {el.type === 'metric' && <MetricContent el={el} />}
    </motion.div>
  );
}
