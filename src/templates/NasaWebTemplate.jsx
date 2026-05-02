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

  // El editor asume una pantalla de PC estándar (16:9).
  // Si height es 100 (100vh), el aspect-ratio es 16/9.
  // Si el usuario modificó height a 200, el aspect-ratio es 16/18.
  // De esta forma respetamos la deformación/tamaño exacto que hizo en el editor.
  const verticalRatio = 9 * (height / 100);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `16 / ${verticalRatio}`,
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
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
