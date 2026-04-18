import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Search, Image as ImageIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  { label: '🌌 Espacio',      query: 'space galaxy' },
  { label: '💻 Tecnología',    query: 'technology' },
  { label: '🏙️ Ciudad',        query: 'city night' },
  { label: '🌿 Naturaleza',    query: 'nature landscape' },
  { label: '🔬 Ciencia',       query: 'science laboratory' },
  { label: '📚 Educación',     query: 'education books' },
  { label: '🎨 Abstract',      query: 'abstract dark' },
  { label: '🏥 Medicina',      query: 'medicine health' },
];

export default function ImageSearchModal({ isOpen, onClose, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch images from our secure edge function
  const fetchImages = async (queryToSearch) => {
    if (!queryToSearch) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-search', {
        body: { query: queryToSearch, page: 1 }
      });

      if (error) {
        console.error("Supabase Invoke Error:", error);
        throw new Error(`Error de conexión: ${error.message || 'La función no respondió.'}`);
      }

      if (data?.error) {
        console.error("Unsplash Proxy Error:", data.error);
        throw new Error(data.error);
      }
      
      setPhotos(data?.results || []);
    } catch (err) {
      console.error("Unsplash Error:", err);
      // Fallback a algunas demos duras si falla por límite u otro error
      setErrorMsg(`Error: ${err.message || 'Fallo al conectar con Unsplash'}`);
      setPhotos([
        { id: 'dev1', urls: { regular: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070' }, user: { name: 'Unsplash Demo', links: { html: 'https://unsplash.com' } } },
        { id: 'dev2', urls: { regular: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070' }, user: { name: 'Unsplash Demo', links: { html: 'https://unsplash.com' } } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categoría inicial cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      fetchImages(CATEGORIES[activeCategory].query);
    }
  }, [isOpen, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: '20px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '800px', height: '85vh',
          background: '#0d0d14', border: '1px solid rgba(0,240,255,0.15)',
          borderRadius: '20px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 50px rgba(0,240,255,0.05)'
        }}
      >
        {/* Header con Branding de Unsplash */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="#22d3ee" />
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Buscador de Imágenes
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '28px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Powered by</span>
              <svg width="12" height="12" viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path>
              </svg>
              <a href="https://unsplash.com/?utm_source=pablito_expo&utm_medium=referral" target="_blank" rel="noopener noreferrer" 
                 style={{ color: '#fff', fontSize: '11px', fontWeight: '800', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.color = '#22d3ee'}
                 onMouseLeave={e => e.currentTarget.style.color = '#fff'}
              >
                Unsplash
              </a>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <XIcon />
          </button>
        </div>

        {/* Buscador libre y URL personalizada */}
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Unsplash Search */}
          <div style={{ flex: '2 1 300px', position: 'relative' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchImages(searchQuery); }}
              placeholder="Buscar en todo Unsplash (ej. robots, neon, data)..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px 14px 12px 38px', color: '#fff', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={() => fetchImages(searchQuery)}
              style={{
                position: 'absolute', right: '6px', top: '6px', bottom: '6px',
                padding: '0 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                background: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: 'none', cursor: 'pointer',
              }}
            >
              Buscar
            </button>
          </div>

          {/* Pegar URL Directa */}
          <div style={{ flex: '1 1 200px', display: 'flex', gap: '8px' }}>
            <input
              type="text" value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              placeholder="O pega link directo..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={() => { if (customUrl.trim()) { onSelect(customUrl.trim()); onClose(); } }}
              disabled={!customUrl.trim()}
              style={{
                padding: '0 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                background: customUrl.trim() ? '#22d3ee' : 'rgba(255,255,255,0.05)',
                color: customUrl.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                border: 'none', cursor: customUrl.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <LinkIcon size={14} />
            </button>
          </div>
        </div>

        {/* Categorías Rápidas */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {CATEGORIES.map((c, i) => (
            <button
              key={i}
              onClick={() => { setActiveCategory(i); setSearchQuery(''); fetchImages(c.query); }}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                background: i === activeCategory && !searchQuery ? 'rgba(34,211,238,0.15)' : 'transparent',
                color: i === activeCategory && !searchQuery ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${i === activeCategory && !searchQuery ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid de Fotos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {errorMsg && (
            <div style={{ padding: '12px', background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#22d3ee', fontSize: '13px' }}>
              Cargando desde Unsplash...
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', paddingTop: '40px', fontSize: '13px' }}>
              No se encontraron imágenes.
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'
            }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#111', aspect: '16/10' }}>
                  {/* Imagen (Click = Seleccionar) */}
                  <img
                    onClick={() => { onSelect(photo.urls.regular); onClose(); }}
                    src={`${photo.urls.raw}&q=60&w=400`}
                    alt={photo.alt_description || 'Unsplash image'}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />

                  {/* Etiqueta de Autor (Requisito Unsplash API Guidelines) */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    padding: '24px 10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    pointerEvents: 'none', // Deja pasar el click a la imagen
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {photo.user.profile_image && (
                        <img src={photo.user.profile_image.small} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                      )}
                      <a
                        href={`https://unsplash.com/@${photo.user.username}?utm_source=pablito_expo&utm_medium=referral`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: '#fff', fontSize: '10px', textDecoration: 'none', fontWeight: '600', pointerEvents: 'auto' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        title="Ver autor en Unsplash"
                      >
                        {photo.user.name}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Requisito */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)'
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Resultados provistos por la <a href="https://unsplash.com/?utm_source=pablito_expo&utm_medium=referral" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>API de Unsplash</a>
          </span>
        </div>
      </div>
    </div>
  );
}

// Simple X Icon SVG
function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
