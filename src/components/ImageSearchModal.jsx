import { useState } from 'react';

// Curated photo categories with known-good Unsplash photo IDs
const CATEGORIES = [
  { label: '🌌 Espacio',      query: 'space galaxy', photos: [
    'photo-1462331940025-496dfbfc7564', 'photo-1446776811953-b23d57bd21aa', 'photo-1451187580459-43490279c0fa',
    'photo-1614732414444-096e5f1122d5', 'photo-1462332420958-a05d1e002413', 'photo-1419242902214-272b3f66ee7a',
  ]},
  { label: '💻 Tecnología',    query: 'technology', photos: [
    'photo-1518770660439-4636190af475', 'photo-1526374965328-7f61d4dc18c5', 'photo-1550751827-4bd374c3f58b',
    'photo-1488590528505-98d2b5aba04b', 'photo-1461749280684-dccba630e2f6', 'photo-1504639725590-34d0984388bd',
  ]},
  { label: '🏙️ Ciudad',        query: 'city night', photos: [
    'photo-1477959858617-67f85cf4f1df', 'photo-1449824913935-59a10b8d2000', 'photo-1514565131-fce0801e5785',
    'photo-1480714378408-67cf0d13bc1b', 'photo-1519501025264-65ba15a82390', 'photo-1444723121867-7a241cacace9',
  ]},
  { label: '🌿 Naturaleza',    query: 'nature', photos: [
    'photo-1441974231531-c6227db76b6e', 'photo-1470071459604-3b5ec3a7fe05', 'photo-1446776877081-d282a0f896e2',
    'photo-1472214103451-9374bd1c798e', 'photo-1506744038136-46273834b3fb', 'photo-1469474968028-56623f02e42e',
  ]},
  { label: '🔬 Ciencia',       query: 'science laboratory', photos: [
    'photo-1532094349884-543bc11b234d', 'photo-1507413245164-6160d8298b31', 'photo-1576086213369-97a306d36557',
    'photo-1628595351029-c2bf17511435', 'photo-1614935151651-0bea6508db6b', 'photo-1581093458791-9f3c3900df4b',
  ]},
  { label: '📚 Educación',     query: 'education books', photos: [
    'photo-1503676260728-1c00da094a0b', 'photo-1524178232363-1fb2b075b655', 'photo-1497633762265-9d179a990aa6',
    'photo-1481627834876-b7833e8f5570', 'photo-1456513080510-7bf3a84b82f8', 'photo-1513475382585-d06e58bcb0e0',
  ]},
  { label: '🎨 Abstract',      query: 'abstract dark', photos: [
    'photo-1557683316-973673baf926', 'photo-1558618666-fcd25c85f82e', 'photo-1553356084-58ef4a67b2a7',
    'photo-1550684848-fac1c5b4e853', 'photo-1557672172-298e090bd0f1', 'photo-1579546929662-711aa81148cf',
  ]},
  { label: '🏥 Medicina',      query: 'medicine health', photos: [
    'photo-1576091160399-112ba8d25d1d', 'photo-1559757175-5700dde675bc', 'photo-1530497610245-94d3c16cda28',
    'photo-1584515933487-779824d29309', 'photo-1532938911079-1b06ac7ceec7', 'photo-1579684385127-1ef15d508118',
  ]},
];

function toUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?q=80&w=2070`;
}

export default function ImageSearchModal({ isOpen, onClose, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const cat = CATEGORIES[activeCategory];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '680px', maxWidth: '95vw', maxHeight: '85vh',
          background: '#0d0d14', border: '1px solid rgba(0,240,255,0.15)',
          borderRadius: '20px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#22d3ee', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🖼️ Buscar Imagen
          </span>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Custom URL input */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <input
            type="text" value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            placeholder="Pega cualquier URL de imagen aquí..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '12px', outline: 'none',
            }}
          />
          <button
            onClick={() => { if (customUrl.trim()) { onSelect(customUrl.trim()); onClose(); } }}
            disabled={!customUrl.trim()}
            style={{
              padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
              background: customUrl.trim() ? '#22d3ee' : 'rgba(255,255,255,0.05)',
              color: customUrl.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: customUrl.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Usar URL
          </button>
        </div>

        {/* Category pills */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                background: i === activeCategory ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)',
                color: i === activeCategory ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${i === activeCategory ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <div style={{
          padding: '0 20px 20px', flex: 1, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {cat.photos.map((photoId, i) => {
            const url = toUrl(photoId);
            return (
              <button
                key={i}
                onClick={() => { onSelect(url); onClose(); }}
                style={{
                  aspect: '16/10', borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                  background: '#111', position: 'relative', padding: 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <img
                  src={`https://images.unsplash.com/${photoId}?q=60&w=400`}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '8px',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <span style={{ fontSize: '10px', color: '#22d3ee', fontWeight: '700' }}>USAR ESTA</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
            Imágenes de Unsplash · Gratis para uso comercial
          </span>
        </div>
      </div>
    </div>
  );
}
