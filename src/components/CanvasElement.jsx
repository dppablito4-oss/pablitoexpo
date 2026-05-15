import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
  TextContent, ImageContent, MetricContent,
  TimelineContent, ComparisonContent, FormulaContent,
  CodeContent, BentoContent, CounterContent, BlockquoteContent,
} from './ElementRenderer';

const HANDLE = {
  width: 10, height: 10,
  background: '#22d3ee', borderRadius: '50%',
  border: '2px solid #0e7490',
  position: 'absolute', zIndex: 400,
};

export default function CanvasElement({
  el, isSelected, onSelect, onUpdate, onDelete, containerRef,
}) {
  const [editing, setEditing] = useState(false);
  const [cSize, setCSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    if (!containerRef?.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCSize({ w: width || 800, h: height || 500 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  const cW = () => cSize.w;
  const cH = () => cSize.h;

  const toPx  = (pct, dim) => (pct / 100) * dim;
  const toPct = (px, dim)  => +((px / dim) * 100).toFixed(2);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!editing) onSelect(el.id);
  };

  const handleDblClick = (e) => {
    e.stopPropagation();
    if (el.type === 'text') setEditing(true);
  };

  // Map element type to the matching renderer component
  function renderContent() {
    switch (el.type) {
      case 'text':
        return (
          <TextContent
            el={el}
            editing={editing}
            onContentChange={(txt) => {
              onUpdate(el.id, { content: txt });
              setEditing(false);
            }}
          />
        );
      case 'image':      return <ImageContent      el={el} />;
      case 'metric':     return <MetricContent     el={el} />;
      case 'timeline':   return <TimelineContent   el={el} />;
      case 'comparison': return <ComparisonContent el={el} />;
      case 'formula':    return <FormulaContent    el={el} />;
      case 'code':       return <CodeContent       el={el} />;
      case 'bento':      return <BentoContent      el={el} />;
      case 'counter':    return <CounterContent    el={el} />;
      case 'blockquote': return <BlockquoteContent el={el} />;
      default:           return null;
    }
  }

  // ── Smart resize: corners = proportional, sides = container only ────────
  const handleResizeStop = (_, direction, ref, _delta, pos) => {
    const newW = Math.max(5, toPct(ref.offsetWidth, cW()));
    const newH = Math.max(2, toPct(ref.offsetHeight, cH()));

    const updates = {
      w: newW, h: newH,
      x: Math.max(0, toPct(pos.x, cW())),
      y: Math.max(0, toPct(pos.y, cH())),
    };

    onUpdate(el.id, updates);
  };

  // Font size badge
  const fontSizeLabel = el.style?.fontSize ? `${el.style.fontSize}` : null;

  return (
    <Rnd
      size={{ width: toPx(el.w, cW()), height: toPx(el.h, cH()) }}
      position={{ x: toPx(el.x, cW()), y: toPx(el.y, cH()) }}
      disableDragging={editing}
      enableResizing={isSelected && !editing}
      onDragStop={(_, d) => onUpdate(el.id, {
        x: Math.max(0, Math.min(95, toPct(d.x, cW()))),
        y: Math.max(0, Math.min(95, toPct(d.y, cH()))),
      })}
      onResizeStop={handleResizeStop}
      onClick={(e) => { e.stopPropagation(); }}
      onPointerDown={handleClick}
      onDoubleClick={handleDblClick}
      bounds="parent"
      style={{ zIndex: isSelected ? 200 : 10 }}
      resizeHandleStyles={isSelected ? {
        topLeft:     { ...HANDLE, top: -5,  left: -5 },
        topRight:    { ...HANDLE, top: -5,  right: -5 },
        bottomLeft:  { ...HANDLE, bottom: -5, left: -5 },
        bottomRight: { ...HANDLE, bottom: -5, right: -5 },
        right:  { ...HANDLE, top: '50%', right: -4,  borderRadius: '3px', width: 6,  height: 22 },
        left:   { ...HANDLE, top: '50%', left: -4,   borderRadius: '3px', width: 6,  height: 22 },
        bottom: { ...HANDLE, bottom: -4, left: '50%', borderRadius: '3px', height: 6, width: 22 },
        top:    { ...HANDLE, top: -4,    left: '50%', borderRadius: '3px', height: 6, width: 22 },
      } : {}}
    >
      <div
        onBlur={() => { if (editing) setEditing(false); }}
        style={{
          width: '100%', height: '100%',
          containerType: 'inline-size',
          border: isSelected
            ? '1.5px solid rgba(34,211,238,0.85)'
            : '1px solid rgba(255,255,255,0.04)',
          borderRadius: '2px',
          cursor: editing ? 'text' : 'move',
          position: 'relative',
          background: isSelected ? 'rgba(34,211,238,0.03)' : 'transparent',
          boxShadow: isSelected ? '0 0 0 3px rgba(34,211,238,0.07)' : 'none',
          overflow: 'hidden',
        }}
      >
        {renderContent()}

        {/* Type badge + font size indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: -18, left: 0,
            display: 'flex', gap: '2px', zIndex: 410,
          }}>
            <div style={{
              fontSize: '9px', background: '#22d3ee', color: '#000',
              padding: '1px 6px', borderRadius: '3px 3px 0 0',
              fontWeight: 'bold', letterSpacing: '0.05em',
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              {el.type}{el.type === 'text' ? ' · dbl clic para editar' : ''}
            </div>
            {fontSizeLabel && (
              <div style={{
                fontSize: '9px', background: 'rgba(168,85,250,0.9)', color: '#fff',
                padding: '1px 5px', borderRadius: '3px 3px 0 0',
                fontWeight: 'bold', whiteSpace: 'nowrap',
              }}>
                {fontSizeLabel}
              </div>
            )}
          </div>
        )}

        {/* Delete button */}
        {isSelected && !editing && (
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDelete(el.id); }}
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 20, height: 20,
              background: '#ef4444', border: '2px solid #7f1d1d',
              borderRadius: '50%', color: 'white',
              fontSize: 11, cursor: 'pointer', zIndex: 410,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', lineHeight: 1, padding: 0,
            }}
          >×</button>
        )}
      </div>
    </Rnd>
  );
}
