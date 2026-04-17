export default function SiteFooter() {
  return (
    <footer
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #050508 0%, #0a0a14 60%, #0d0519 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '28px 32px 20px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
      }}>

        {/* Branding */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              borderRadius: '6px',
              width: '24px', height: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '900', color: '#000',
            }}>P</span>
            <span style={{
              fontSize: '13px', fontWeight: '800', letterSpacing: '0.12em',
              background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>PABLITO EXPO</span>
          </div>
          <p style={{ fontSize: '10px', color: '#404060', lineHeight: '1.5', maxWidth: '220px', margin: 0 }}>
            Plataforma de presentaciones interactivas y scrollytelling.
          </p>
        </div>

        {/* Credits dev */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h4 style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.18em',
                        color: '#22d3ee', textTransform: 'uppercase', marginBottom: '6px', marginTop: 0 }}>
            Desarrollo Web
          </h4>
          <p style={{ fontSize: '11px', color: '#c0c0d0', margin: '0 0 3px' }}>
            Developed by <span style={{ fontWeight: '700', color: '#fff' }}>Samuel Y. Pablo Claudio</span>
          </p>
          <p style={{ fontSize: '10px', color: '#505060', margin: '0 0 8px' }}>
            Diseño y desarrollo de la página web.
          </p>
          <a
            href="https://wa.me/918165428?text=Hola%20SAMUEL%20PABLO%20"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em',
              color: '#000', background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
              padding: '5px 12px', borderRadius: '20px', textDecoration: 'none',
              textTransform: 'uppercase', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            📲 Contactar Developer
          </a>
        </div>

        {/* Copyright */}
        <div style={{ flex: '1', minWidth: '180px', textAlign: 'right' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '4px 10px', marginBottom: '6px',
          }}>
            <span style={{ fontSize: '9px', color: '#a855f7', fontWeight: '700', letterSpacing: '0.15em' }}>PABLITO_DP</span>
          </div>
          <p style={{ fontSize: '10px', color: '#303045', margin: '0', lineHeight: 1.6 }}>
            © 2025–2026 <span style={{ color: '#505065', fontWeight: '600' }}>pablitodp</span>
          </p>
          <p style={{ fontSize: '9px', color: '#252535', margin: '2px 0 0' }}>
            Todos los derechos reservados.
          </p>
        </div>

      </div>

      {/* Bottom line */}
      <div style={{
        maxWidth: '1200px', margin: '20px auto 0',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: '10px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '9px', color: '#252535', margin: 0, letterSpacing: '0.1em' }}>
          POWERED BY P.A.B.L.O. · PABLITO EXPO v2 · ALL RIGHTS RESERVED · PABLITO_DP 2025–2026
        </p>
      </div>
    </footer>
  );
}
