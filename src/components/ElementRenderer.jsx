import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import UnsplashBadge from './UnsplashBadge';

// ── Scale helpers ──────────────────────────────────────────────────────────────
// Reference canvas: 1600px wide = 100cqw → 1cqw = 16px
// toCqw: for Text/Image elements (container = section, ~1600px)
const toCqw = (px) => `${((px || 16) / 16).toFixed(3)}cqw`;

// toWCqw: for Widget elements (container = the element itself, typically ~40% of section)
// Each widget sets containerType:'inline-size' so cqw references its OWN width.
// Scale factor 2.5 compensates for element being ~40% of section (1600*0.4=640px).
// Result: content scales proportionally when you resize the element box.
const WIDGET_CQW_SCALE = 2.5;
const toWCqw = (px) => `${((px || 16) / 16 * WIDGET_CQW_SCALE).toFixed(3)}cqw`;
// Literal cqw multiplier helper for hardcoded values like padding
const wCqw = (v) => `${(v * WIDGET_CQW_SCALE).toFixed(3)}cqw`;

// Common style for widget root containers
const WIDGET_CONTAINER = { containerType: 'inline-size', width: '100%', height: '100%' };

// ── useFitText hook ────────────────────────────────────────────────────────────
// Binary-searches the largest fontSize (in cqw) that fits inside the element.
// Returns a CSS fontSize string. Only active when enabled=true.
function useFitText(ref, content, maxFontPx, enabled) {
  const [fontSize, setFontSize] = useState(toCqw(maxFontPx));

  const compute = useCallback(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const H = el.clientHeight;
    const W = el.clientWidth;
    if (!H || !W) return;

    let lo = 4, hi = maxFontPx;
    // binary search in px, then convert result to cqw
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      const overflows = el.scrollHeight > H + 2 || el.scrollWidth > W + 2;
      if (overflows) hi = mid;
      else lo = mid;
    }
    el.style.fontSize = ''; // clear inline — we'll apply via state

    // Convert fitted px to cqw relative to the section container
    // cqw = px / containerWidth * 100
    // We walk up to find the container (the one with container-type)
    let containerW = W; // fallback: element's own width
    let node = el.parentElement;
    while (node) {
      const ct = getComputedStyle(node).containerType;
      if (ct && ct !== 'normal') { containerW = node.clientWidth; break; }
      node = node.parentElement;
    }
    const fitCqw = containerW > 0 ? (lo / containerW) * 100 : lo / 16;
    setFontSize(`${fitCqw.toFixed(3)}cqw`);
  }, [content, maxFontPx, enabled]);

  useEffect(() => {
    if (!enabled || !ref.current) {
      setFontSize(toCqw(maxFontPx));
      return;
    }
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [compute, enabled, maxFontPx]);

  return fontSize;
}

// ── Text ─────────────────────────────────────────────────────────────────────
export function TextContent({ el, editing = false, onContentChange }) {
  const s = el.style || {};
  const ref = useRef(null);
  const autoFit = s.autoFit !== false; // default ON
  const maxFontPx = s.fontSize || 28;
  const fittedSize = useFitText(ref, el.content, maxFontPx, autoFit && !editing);

  // Build text-decoration
  const decorations = [
    s.underline ? 'underline' : '',
    s.strikethrough ? 'line-through' : '',
  ].filter(Boolean).join(' ') || 'none';

  // Build background (supports bgColor + bgOpacity)
  const bgStyle = s.bgColor
    ? `${s.bgColor}${Math.round((s.bgOpacity ?? 0.5) * 255).toString(16).padStart(2, '0')}`
    : 'transparent';

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={editing ? (e) => onContentChange?.(e.currentTarget.innerText) : undefined}
      style={{
        width: '100%', height: '100%',
        fontSize: autoFit && !editing ? fittedSize : toCqw(maxFontPx),
        fontWeight: s.fontWeight || 'normal',
        color: s.color || '#ffffff',
        textAlign: s.textAlign || 'left',
        opacity: s.opacity ?? 1,
        lineHeight: s.lineHeight || 1.25,
        cursor: editing ? 'text' : 'default',
        outline: 'none',
        overflow: autoFit ? 'hidden' : 'visible',
        textShadow: s.textShadow === false ? 'none' : '0 2px 20px rgba(0,0,0,0.9)',
        userSelect: editing ? 'text' : 'none',
        fontFamily: s.fontFamily || 'inherit',
        textTransform: s.textTransform || 'none',
        letterSpacing: s.letterSpacing ? `${s.letterSpacing}em` : 'normal',
        fontStyle: s.italic ? 'italic' : 'normal',
        textDecoration: decorations,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: bgStyle,
        borderRadius: s.bgRadius ? `${s.bgRadius}px` : '0',
        padding: s.bgColor ? '0.5cqw 0.75cqw' : '0',
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
        color: '#555', fontSize: toCqw(11), textAlign: 'center', padding: '8px',
      }}>
        🖼️ Pega URL en el inspector →
      </div>
    );
  }

  // Build CSS filter string from individual values
  const filters = [
    s.brightness != null && s.brightness !== 100 ? `brightness(${s.brightness}%)` : '',
    s.contrast != null && s.contrast !== 100 ? `contrast(${s.contrast}%)` : '',
    s.blur ? `blur(${s.blur}px)` : '',
    s.grayscale ? `grayscale(${s.grayscale}%)` : '',
    s.sepia ? `sepia(${s.sepia}%)` : '',
  ].filter(Boolean).join(' ') || 'none';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={el.src} alt={el.alt || ''} draggable={false} loading="lazy" style={{
        width: '100%', height: '100%',
        objectFit: s.objectFit || 'cover',
        opacity: s.opacity ?? 1,
        borderRadius: `${s.borderRadius || 0}px`,
        boxShadow: s.shadow ? '0 20px 60px rgba(0,0,0,0.7)' : 'none',
        filter: filters,
        pointerEvents: 'none',
        display: 'block',
        transform: `scaleX(${s.flipH ? -1 : 1}) scaleY(${s.flipV ? -1 : 1})`,
      }} />
      <UnsplashBadge credit={el.unsplashCredit} />
    </div>
  );
}

// ── Metric ────────────────────────────────────────────────────────────────────
export function MetricContent({ el }) {
  const s = el.style || {};
  const valColor1 = s.valColor || '#ffffff';
  const valColor2 = s.valColor2 || '#888888';
  const titleColor = s.titleColor || '#22d3ee';
  const descColor = s.descColor || '#6b7280';
  const borderColor = s.borderColor || 'rgba(255,255,255,0.15)';
  const maxValCqw = (s.fontSize || 64) / 16 * WIDGET_CQW_SCALE;
  const charCount = (String(el.prefix || '').length + String(el.val || '?').length + String(el.suffix || '').length) || 1;

  return (
    <div style={{
      ...WIDGET_CONTAINER, color: s.color || '#fff',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      paddingTop: wCqw(0.875), borderTop: `2px solid ${borderColor}`,
    }}>
      {el.icon && (
        <div style={{ fontSize: toWCqw(28), marginBottom: wCqw(0.25) }}>
          {el.icon}
        </div>
      )}
      <div style={{
        fontSize: `min(${maxValCqw}cqw, 90cqi / ${charCount})`,
        fontWeight: '900', lineHeight: 1, letterSpacing: '-0.02em',
        background: `linear-gradient(to bottom, ${valColor1}, ${valColor2})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        {el.prefix || ''}{el.val || '?'}{el.suffix || ''}
      </div>
      <div style={{
        fontSize: toWCqw(13), fontWeight: '700', color: titleColor,
        marginTop: wCqw(0.5), letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        {el.title || 'MÉTRICA'}
      </div>
      {el.desc && (
        <div style={{
          fontSize: toWCqw(11), color: descColor, fontFamily: 'monospace',
          textTransform: 'uppercase', marginTop: wCqw(0.25), letterSpacing: '0.05em',
        }}>
          {el.desc}
        </div>
      )}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export function TimelineContent({ el }) {
  const items = el.items || [];
  const accentColor = el.style?.color || '#22d3ee';
  const titleColor = el.style?.titleColor || '#ffffff';
  return (
    <div style={{ ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${wCqw(0.5)} 0`, overflow: 'hidden' }}>
      {el.title && (
        <div style={{ fontSize: toWCqw(18), fontWeight: '800', color: titleColor, marginBottom: wCqw(1), letterSpacing: '-0.02em' }}>
          {el.title}
        </div>
      )}
      <div style={{ position: 'relative', paddingLeft: wCqw(1.75), flex: 1, overflow: 'hidden' }}>
        {/* Vertical line */}
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: '100%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          viewport={{ once: false }}
          style={{
            position: 'absolute', left: wCqw(0.5), top: 0,
            width: '2px', background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
          }}
        />
        {items.map((item, i) => {
          const nodeColor = item.color || accentColor;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              viewport={{ once: false, amount: 0.3 }}
              style={{ marginBottom: i < items.length - 1 ? wCqw(1.25) : 0, position: 'relative' }}
            >
              <div style={{
                position: 'absolute', left: wCqw(-1.5), top: wCqw(0.15),
                minWidth: '8px', minHeight: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon ? (
                  <span style={{ fontSize: toWCqw(14), lineHeight: 1 }}>{item.icon}</span>
                ) : (
                  <div style={{
                    width: wCqw(0.75), height: wCqw(0.75), borderRadius: '50%',
                    background: nodeColor, boxShadow: `0 0 12px ${nodeColor}`,
                    border: '2px solid rgba(0,0,0,0.6)',
                    minWidth: '8px', minHeight: '8px',
                  }} />
                )}
              </div>
              <div style={{ fontSize: toWCqw(11), fontWeight: '800', color: nodeColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {item.year || item.date || ''}
              </div>
              <div style={{ fontSize: toWCqw(15), fontWeight: '700', color: '#fff', marginTop: wCqw(0.1) }}>
                {item.title || ''}
              </div>
              {item.desc && (
                <div style={{ fontSize: toWCqw(12), color: 'rgba(255,255,255,0.5)', marginTop: wCqw(0.1), lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Comparison ────────────────────────────────────────────────────────────────
export function ComparisonContent({ el }) {
  const columns = el.columns || [];
  const ITEM_ICONS = { yes: '✅', no: '❌', neutral: '⚪' };
  return (
    <div style={{ ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Global title */}
      {el.title && (
        <div style={{
          fontSize: toWCqw(16), fontWeight: '800', color: '#ffffff',
          marginBottom: wCqw(0.625), letterSpacing: '-0.02em',
          textAlign: 'center',
        }}>
          {el.title}
        </div>
      )}
      <div style={{ display: 'flex', gap: wCqw(0.75), alignItems: 'stretch', flex: 1, overflow: 'hidden' }}>
        {columns.map((col, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.6 }}
            viewport={{ once: false }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: col.highlighted
                ? `linear-gradient(135deg, ${col.color || '#22d3ee'}11, ${col.color || '#22d3ee'}08)`
                : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              border: col.highlighted
                ? `2px solid ${col.color || '#22d3ee'}66`
                : `1px solid ${col.color || 'rgba(255,255,255,0.1)'}33`,
              borderRadius: wCqw(0.875), padding: wCqw(1.125), overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Recommended badge */}
            {col.highlighted && (
              <div style={{
                position: 'absolute', top: wCqw(0.4), right: wCqw(0.4),
                fontSize: toWCqw(8), fontWeight: '800', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#000',
                background: col.color || '#22d3ee', padding: `${wCqw(0.15)} ${wCqw(0.5)}`,
                borderRadius: wCqw(0.3),
              }}>
                ★ Recomendado
              </div>
            )}
            <div style={{
              fontSize: toWCqw(16), fontWeight: '800', color: col.color || '#fff',
              marginBottom: wCqw(0.75), letterSpacing: '-0.02em',
              borderBottom: `2px solid ${col.color || 'rgba(255,255,255,0.15)'}`,
              paddingBottom: wCqw(0.5),
              paddingTop: col.highlighted ? wCqw(1) : '0',
            }}>
              {col.title || `Opción ${i + 1}`}
            </div>
            {(col.items || []).map((item, j) => {
              // Items can be string or {text, icon} object
              const isObj = typeof item === 'object' && item !== null;
              const text = isObj ? item.text : item;
              const icon = isObj ? item.icon : null;
              return (
                <div key={j} style={{
                  fontSize: toWCqw(13), color: 'rgba(255,255,255,0.7)',
                  padding: `${wCqw(0.375)} 0`, borderBottom: '1px solid rgba(255,255,255,0.05)',
                  lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: wCqw(0.35),
                }}>
                  {icon && <span style={{ fontSize: toWCqw(12), flexShrink: 0 }}>{ITEM_ICONS[icon] || icon}</span>}
                  <span>{text}</span>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Formula (KaTeX) ───────────────────────────────────────────────────────────
export function FormulaContent({ el }) {
  const ref = useRef(null);
  const s = el.style || {};
  const formula = el.content || 'E = mc^2';
  const label = el.label || '';
  const glowColor = s.glowColor || 'rgba(34,211,238,0.3)';
  const labelColor = s.labelColor || 'rgba(255,255,255,0.4)';
  const bgColor = s.bgColor || 'transparent';

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, { displayMode: true, throwOnError: false, output: 'html' });
      } catch {
        ref.current.textContent = formula;
      }
    }
  }, [formula]);

  return (
    <div style={{
      ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: bgColor,
      borderRadius: bgColor !== 'transparent' ? wCqw(0.5) : '0',
      padding: wCqw(1),
    }}>
      <div
        ref={ref}
        style={{
          fontSize: toWCqw(s.fontSize || 32),
          color: s.color || '#ffffff',
          filter: `drop-shadow(0 0 20px ${glowColor})`,
        }}
      />
      {label && (
        <div style={{
          fontSize: toWCqw(12), color: labelColor,
          marginTop: wCqw(0.625), fontStyle: 'italic', letterSpacing: '0.04em',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Code Terminal ─────────────────────────────────────────────────────────────
export function CodeContent({ el }) {
  const s = el.style || {};
  const lang = el.language || 'python';
  const code = el.content || '# Tu código aquí';
  const filename = el.filename || '';
  const showLineNumbers = el.showLines !== false;
  const bgColor = s.bgColor || '#0d1117';
  const lines = code.split('\n');

  return (
    <div style={{
      ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column',
      background: bgColor, borderRadius: wCqw(0.75), overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* macOS titlebar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: `${wCqw(0.625)} ${wCqw(0.875)}`, background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: wCqw(0.625), height: wCqw(0.625), minWidth: '8px', minHeight: '8px', borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: wCqw(0.625), height: wCqw(0.625), minWidth: '8px', minHeight: '8px', borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: wCqw(0.625), height: wCqw(0.625), minWidth: '8px', minHeight: '8px', borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: wCqw(0.625), fontSize: toWCqw(11), color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          {filename || lang}
        </span>
      </div>
      {/* Code body */}
      <pre style={{
        flex: 1, margin: 0, padding: wCqw(1),
        fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
        fontSize: toWCqw(s.fontSize || 14),
        color: '#e6edf3', lineHeight: 1.6,
        overflow: 'auto', whiteSpace: 'pre',
        tabSize: 4, display: 'flex',
      }}>
        {showLineNumbers && (
          <span style={{
            color: 'rgba(255,255,255,0.15)', userSelect: 'none',
            textAlign: 'right', paddingRight: wCqw(1), marginRight: wCqw(1),
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'inline-block', minWidth: wCqw(2.5),
          }}>
            {lines.map((_, i) => `${i + 1}\n`).join('')}
          </span>
        )}
        <code style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</code>
      </pre>
    </div>
  );
}

// ── Bento Grid ────────────────────────────────────────────────────────────────
export function BentoContent({ el }) {
  const s = el.style || {};
  const items = el.items || [];
  const cols = s.columns || 3;
  const borderColor = s.borderColor || 'rgba(255,255,255,0.07)';
  const bgOpacity = s.bgOpacity ?? 0.03;
  return (
    <div style={{
      ...WIDGET_CONTAINER,
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridAutoRows: `minmax(${wCqw(5)}, auto)`,
      gap: wCqw(0.625),
    }}>
      {items.map((item, i) => {
        const isLarge = item.size === 'large';
        const itemColor = item.color || borderColor;
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
              background: `rgba(255,255,255,${bgOpacity})`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${itemColor}`,
              borderRadius: wCqw(0.875), padding: wCqw(1.125),
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {item.icon && (
              <div style={{ fontSize: toWCqw(28), marginBottom: wCqw(0.625) }}>{item.icon}</div>
            )}
            <div style={{ fontSize: toWCqw(isLarge ? 16 : 13), fontWeight: '700', color: '#fff', marginBottom: wCqw(0.25) }}>
              {item.title || `Item ${i + 1}`}
            </div>
            {item.desc && (
              <div style={{ fontSize: toWCqw(11), color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
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
  const s = el.style || {};
  const targetVal = parseInt(el.val) || 0;
  const prefix = el.prefix || '';
  const suffix = el.suffix || '';
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const gradColor1 = s.gradColor1 || '#ffffff';
  const gradColor2 = s.gradColor2 || '#22d3ee';
  const titleColor = s.titleColor || '#22d3ee';
  const descColor = s.descColor || 'rgba(255,255,255,0.4)';

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
            const eased = 1 - Math.pow(1 - progress, 3);
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

  const maxCountCqw = (s.fontSize || 96) / 16 * WIDGET_CQW_SCALE;
  const displayText = `${prefix}${count}${suffix}`;
  const charCount = displayText.length || 1;

  return (
    <div ref={ref} style={{
      ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: `min(${maxCountCqw}cqw, 90cqi / ${charCount})`,
        fontWeight: '900', lineHeight: 1, letterSpacing: '-0.04em',
        background: `linear-gradient(135deg, ${gradColor1}, ${gradColor2})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        {displayText}
      </div>
      {el.title && (
        <div style={{ fontSize: toWCqw(14), fontWeight: '700', color: titleColor, marginTop: wCqw(0.5), letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {el.title}
        </div>
      )}
      {el.desc && (
        <div style={{ fontSize: toWCqw(12), color: descColor, marginTop: wCqw(0.25) }}>
          {el.desc}
        </div>
      )}
    </div>
  );
}

// ── Blockquote ────────────────────────────────────────────────────────────────
export function BlockquoteContent({ el }) {
  const s = el.style || {};
  const authorColor = s.authorColor || '#22d3ee';
  const quoteColor = s.color || '#ffffff';
  const watermarkColor = s.watermarkColor || 'rgba(255,255,255,0.04)';
  const accentColor = s.accentColor || 'transparent';
  const bgColor = s.bgColor || 'transparent';

  return (
    <div style={{
      ...WIDGET_CONTAINER, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      position: 'relative', padding: wCqw(1), overflow: 'hidden',
      background: bgColor,
      borderLeft: accentColor !== 'transparent' ? `4px solid ${accentColor}` : 'none',
      borderRadius: bgColor !== 'transparent' ? wCqw(0.5) : '0',
    }}>
      {/* Giant watermark quotes */}
      <div style={{
        position: 'absolute', top: wCqw(-0.625), left: '0',
        fontSize: toWCqw(140), fontWeight: '900', color: watermarkColor,
        lineHeight: 1, fontFamily: 'Georgia, serif', pointerEvents: 'none',
      }}>
        "
      </div>
      <div style={{
        position: 'absolute', bottom: wCqw(-2.5), right: '0',
        fontSize: toWCqw(140), fontWeight: '900', color: watermarkColor,
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
          fontSize: toWCqw(s.fontSize || 28),
          fontStyle: s.noItalic ? 'normal' : 'italic',
          color: quoteColor,
          fontWeight: s.fontWeight || '400',
          lineHeight: s.lineHeight || 1.5,
          maxWidth: '90%',
          margin: 0, position: 'relative', zIndex: 1,
          fontFamily: s.fontFamily || 'inherit',
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
            fontSize: toWCqw(13), color: authorColor, fontWeight: '600',
            marginTop: wCqw(0.875), letterSpacing: '0.1em', textTransform: 'uppercase',
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
        overflow: 'hidden',
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
