import { ProjectorElement } from '../components/ElementRenderer';

/**
 * NasaWebTemplate — reads the new sections[] format.
 * Each section has: { id, bgImage, height, elements[] }
 * Each element: { id, type, x, y, w, h, style, content/src/val/title/desc }
 */
export default function NasaWebTemplate({ data = {} }) {
  const sections = data.sections || [];

  if (!sections.length) return null;

  return (
    <div style={{ width: '100%' }}>
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionBlock({ section }) {
  const height = section.height || 100;
  const elements = section.elements || [];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: `${height}vh`,
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
      }}
    >
      {/* Background image */}
      {section.bgImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${section.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'scroll',
            zIndex: 0,
          }}
        />
      )}

      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${section.overlayOpacity ?? 0.4})`,
          zIndex: 1,
        }}
      />

      {section.unsplashCredit && (
        <a
          href={`https://unsplash.com/@${section.unsplashCredit.username}?utm_source=pablito_expo&utm_medium=referral`}
          target="_blank" rel="noopener noreferrer"
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
          style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px',
            fontSize: '10px', color: '#fff', textDecoration: 'none',
            pointerEvents: 'auto', opacity: 0.3, transition: 'opacity 0.2s',
            zIndex: 10, backdropFilter: 'blur(4px)', fontWeight: '600'
          }}
        >
          Foto por {section.unsplashCredit.name} en Unsplash
        </a>
      )}

      {/* Elements */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {elements.map((el) => (
          <ProjectorElement key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
}
