import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer
      style={{
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '14px 20px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
        rowGap: '4px',
      }}>

        {/* Left — brand */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: '0.04em' }}>
          POWERED BY{' '}
          <span style={{ color: 'rgba(34,211,238,0.5)', fontWeight: '700' }}>P.A.B.L.O.</span>
          {' '}· PABLITO EXPO v2
        </p>

        {/* Center — links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/terms"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,240,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            Términos y Privacidad
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>·</span>
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            📷 Fotos: Unsplash
          </a>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>·</span>
          <a
            href="https://wa.me/918165428?text=Hola%20SAMUEL%20PABLO%20"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            Samuel Y. Pablo Claudio
          </a>
        </div>

        {/* Right — copyright */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          © 2025–2026{' '}
          <span style={{ color: 'rgba(168,85,247,0.5)', fontWeight: '600' }}>pablitodp</span>
          {' '}· Todos los derechos reservados.
        </p>

      </div>
    </footer>
  );
}
