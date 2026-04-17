import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generateSlug } from '../lib/slugify';

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
      const newTitle = prompt('Nombre de la presentación grupal o personal:', 'Nueva Presentación');
      if (!newTitle) return;

      const { data, error } = await supabase
        .from('presentations')
        .insert([
          { 
            title: newTitle, 
            slug: generateSlug(newTitle),
            user_id: user.id, 
            slides_data: { slides: [{ id: crypto.randomUUID(), type: 'title', content: 'Diapositiva Inicial' }] },
            editors_emails: [user.email] 
          }
        ])
        .select();

      if (error) throw error;
      if (data) fetchPresentations();
    } catch (error) {
      console.error('Error al crear:', error);
      alert('Hubo un error al crear la presentación en la nube.');
    }
  };

  const deletePresentation = async (id, title) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${title}" del servidor? Nadie más podrá verla.`)) return;
    
    const { error } = await supabase.from('presentations').delete().eq('id', id);
    
    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      return;
    }

    // Refresh from DB to confirm deletion
    fetchPresentations();
  };

  const addVipEditor = async (id, currentEditors) => {
    const email = prompt('Escribe el CORREO EXACTO del estudiante ya registrado para darle rango VIP (Editor) en este trabajo:');
    if (!email) return;

    if (currentEditors && currentEditors.includes(email)) {
      alert('¡Ese correo ya tiene acceso VIP!');
      return;
    }

    const newEditors = [...(currentEditors || []), email];

    try {
      const { error } = await supabase
        .from('presentations')
        .update({ editors_emails: newEditors })
        .eq('id', id);
        
      if (error) throw error;
      
      alert(`¡Magia pura! ${email} acaba de recibir rango VIP en tu proyecto de forma silenciosa.`);
      fetchPresentations();
    } catch (error) {
      alert('Muro bloqueado. ¡Solo el Administrador del proyecto (Autor) puede invitar a otras personas!');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}>
          Network Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Operador Registrado: {user?.email}</span>
          <button className="btn-cyber" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={signOut}>
            Desconectar
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Bóveda de Proyectos</h2>
        <button onClick={createPresentation} className="btn-cyber" style={{ width: 'auto' }}>
          + Fundar Proyecto
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sincronizando nodos...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {presentations.length === 0 && (
            <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>El servidor está silencioso. ¡Crea el primer proyecto!</p>
            </div>
          )}

          {presentations.map((pres) => {
            const isOwner = pres.user_id === user.id;
            const isEditor = pres.editors_emails && pres.editors_emails.includes(user.email);
            const canEdit = isOwner || isEditor;

            return (
              <motion.div 
                key={pres.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel" 
                style={{ 
                  padding: '24px', display: 'flex', flexDirection: 'column',
                  border: isOwner ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  boxShadow: isOwner ? '0 0 15px rgba(0,240,255,0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '4px', color: '#fff' }}>{pres.title}</h3>
                  <span style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', background: isOwner ? 'rgba(0,240,255,0.2)' : (isEditor ? 'rgba(112,0,255,0.4)' : 'rgba(255,255,255,0.1)'), color: isOwner ? 'var(--accent-primary)' : '#fff' }}>
                    {isOwner ? '👑 ADMIN' : (isEditor ? '🛠️ VIP' : '👁️ LECTOR')}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Equipo: {pres.editors_emails && pres.editors_emails.length > 0 ? pres.editors_emails.join(', ') : 'Solo tú'}
                </p>
                
                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-cyber" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => navigate(`/projector/${pres.slug || pres.id}`)}>
                      📺 Proyectar 
                    </button>
                    <button className="btn-cyber" style={{ flex: 1, padding: '8px', fontSize: '0.9rem', background: 'rgba(112,0,255,0.1)', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }} onClick={() => navigate(`/remote/${pres.slug || pres.id}`)}>
                      📱 Láser
                    </button>
                  </div>
                  
                  {/* HERRAMIENTAS PROTEGIDAS */}
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => navigate(`/editor/${pres.slug || pres.id}`)} style={{ flex: 3, padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        ✏️ Editor Base
                      </button>
                      {isOwner && (
                        <>
                          <button onClick={() => addVipEditor(pres.id, pres.editors_emails)} style={{ flex: 1, padding: '8px', background: 'rgba(0,240,255,0.1)', color: 'var(--accent-primary)', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', fontSize: '0.8rem' }} title="Conceder rango VIP a compañero">
                            ➕👤
                          </button>
                          <button onClick={() => deletePresentation(pres.id, pres.title)} style={{ flex: 1, padding: '8px', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)' }} title="Eliminar proyecto de la bóveda">
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
