import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresentations();
  }, [user]);

  const fetchPresentations = async () => {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPresentations(data || []);
    } catch (error) {
      console.error('Error fetching presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPresentation = async () => {
    try {
      const newTitle = prompt('Nombre de la presentación:', 'Nueva Presentación');
      if (!newTitle) return;

      const { data, error } = await supabase
        .from('presentations')
        .insert([
          { 
            title: newTitle, 
            user_id: user.id, 
            slides_data: { slides: [{ id: crypto.randomUUID(), type: 'title', content: 'Diapositiva Inicial' }] } 
          }
        ])
        .select();

      if (error) throw error;
      if (data) {
        navigate(`/editor/${data[0].id}`);
      }
    } catch (error) {
      console.error('Error al crear:', error);
      alert('Hubo un error al crear la presentación.');
    }
  };

  const deletePresentation = async (id, title) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${title}"?`)) return;
    try {
      const { error } = await supabase.from('presentations').delete().eq('id', id);
      if (error) throw error;
      setPresentations(presentations.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al borrar:', error);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}>
          PablitoExpo
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
          <button className="btn-cyber" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={signOut}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Mis Presentaciones</h2>
        <button onClick={createPresentation} className="btn-cyber" style={{ width: 'auto' }}>
          + Nueva Presentación
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando datos cuánticos...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {presentations.length === 0 && (
            <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Aún no tienes ninguna presentación en la nube.</p>
            </div>
          )}

          {presentations.map((pres) => (
            <motion.div 
              key={pres.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel" 
              style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>{pres.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Última act. {new Date(pres.created_at).toLocaleDateString()}
              </p>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-cyber" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => navigate(`/projector/${pres.id}`)}>
                    📺 Proyectar
                  </button>
                  <button className="btn-cyber" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => navigate(`/remote/${pres.id}`)}>
                    📱 Remote
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => navigate(`/editor/${pres.id}`)} style={{ flex: 3, padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                    ✏️ Editar Diapositivas
                  </button>
                  <button onClick={() => deletePresentation(pres.id, pres.title)} style={{ flex: 1, padding: '8px', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
