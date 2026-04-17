export default function SiteFooter() {
  return (
    <footer
      style={{
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '12px 32px',
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
        gap: '8px',
      }}>

        {/* Left — brand crédito */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: '0.04em' }}>
          POWERED BY{' '}
          <span style={{ color: 'rgba(34,211,238,0.5)', fontWeight: '700' }}>P.A.B.L.O.</span>
          {' '}· PABLITO EXPO v2
        </p>

        {/* Center — dev credit (subtle) */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Developed by{' '}
          <a
            href="https://wa.me/918165428?text=Hola%20SAMUEL%20PABLO%20"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '600', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(34,211,238,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            Samuel Y. Pablo Claudio
          </a>
        </p>

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
