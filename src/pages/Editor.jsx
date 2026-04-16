import { useParams, useNavigate } from 'react-router-dom';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Editor de Presentación ✏️</h2>
        <button onClick={() => navigate('/')} className="btn-cyber" style={{ width: 'auto', padding: '8px 16px' }}>
          Volver al Dashboard
        </button>
      </header>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>ID en edición: {id}</p>
        <p style={{ color: 'var(--accent-primary)', marginLeft: '10px' }}>(Fase de plantillas en construcción...)</p>
      </div>
    </div>
  );
}
