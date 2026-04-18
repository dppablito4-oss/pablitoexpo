import { ProjectorElement } from '../components/ElementRenderer';
import UnsplashBadge from '../components/UnsplashBadge';

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

      <UnsplashBadge credit={section.unsplashCredit} />

      {/* Elements */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {elements.map((el) => (
          <ProjectorElement key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
}
