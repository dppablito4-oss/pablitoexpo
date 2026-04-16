import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary atrapó un error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff3366', padding: '40px', background: '#110000', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>🚨 ERROR DEL SISTEMA (Falla en el Código) 🚨</h2>
          <p>Tómale captura a esto y envíaselo al asistente:</p>
          <pre style={{ background: '#000', padding: '20px', overflowX: 'auto', border: '1px solid #ff3366' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ color: '#ff9999', fontSize: '0.8rem', marginTop: '20px', overflowX: 'auto' }}>
            {this.state.info?.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', background: '#ff3366', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            RECARGAR SISTEMA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
