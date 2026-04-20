import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const C = {
  bg:       '#06060d',
  cardBg:   'rgba(255, 215, 0, 0.03)',
  border:   'rgba(255, 215, 0, 0.15)',
  gold:     '#ffd700',
  textPrimary: '#e2e8f0',
  textMuted:   'rgba(255,255,255,0.4)',
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // users, logs, boveda
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        // En un entorno de Producción estricto, consultar auth.users directamente requiría Admin API de Supabase, 
        // pero gracias al trigger tenemos un espejo en public.profiles que podemos consultar todos.
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data) setUsers(data);
      } else if (activeTab === 'logs') {
        const { data, error } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (!error && data) setLogs(data);
      } else if (activeTab === 'boveda') {
        // Modo Dios para ver todas las presentaciones gracias a la política que acabamos de agregar (bypass is_public)
        const { data, error } = await supabase.from('presentations').select('*').order('created_at', { ascending: false });
        if (!error && data) setPresentations(data);
      }
    } catch (e) {
      console.error("Error devorando base de datos:", e);
    } finally {
      setLoading(false);
    }
  };

  // Acciones Administrativas
  const handleModifyCredits = async (userId, currentCredits) => {
    const amount = parseInt(prompt(`Créditos de IA actuales: ${currentCredits || 0}\n\nIngresa la cantidad a SUMAR (usa números negativos para restar):`), 10);
    if (isNaN(amount)) return;
    
    // Sumativa y relativa
    const newTotal = Math.max(0, (currentCredits || 0) + amount);

    const { error } = await supabase.from('profiles').update({ ai_credits: newTotal }).eq('id', userId);
    
    if (!error) {
      // Registrar en Logs
      await supabase.from('security_logs').insert([{
        action: 'CREDITS_MODIFIED', details: `Créditos actualizados: ${amount > 0 ? '+' : ''}${amount}. Total ahora: ${newTotal}.`, user_id: userId
      }]);
      fetchData(); // Refrescar vista
    } else {
      alert("Error actualizando créditos: " + error.message);
    }
  };

  const handleUpdateStatus = async (userId, userEmail, currentStatus) => {
    const validStatuses = ['active', 'suspended', 'banned'];
    const newStatus = prompt(`Usuario: ${userEmail}\nEstado Actual: ${currentStatus || 'active'}\n\nEscribe el nuevo estado (active, suspended, banned):`, currentStatus || 'active');
    
    if (!newStatus || !validStatuses.includes(newStatus)) {
      alert("Estado no válido. Operación cancelada.");
      return;
    }

    if (newStatus === currentStatus) return;

    if (window.confirm(`¿Seguro que deseas cambiar el estado de este creador a ${newStatus.toUpperCase()}?`)) {
      const { error } = await supabase.from('profiles').update({ account_status: newStatus }).eq('id', userId);
      if (!error) {
        await supabase.from('security_logs').insert([{ action: 'STATUS_CHANGED', details: `Estado cambiado de ${currentStatus} a ${newStatus}`, user_id: userId }]);
        fetchData();
      }
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: C.textPrimary, padding: '40px' }}>
      
      {/* Header Admin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `1px solid ${C.border}`, paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0, color: C.gold, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>👑</span> PANEL MAESTRO
          </h1>
          <p style={{ color: C.textMuted, fontSize: '0.9rem', marginTop: '10px' }}>
            Consola administrativa. Un gran poder conlleva una gran responsabilidad.
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          Volver al Dashboard
        </button>
      </div>

      {/* Navegación Interna */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')}>👥 Habitantes</TabBtn>
        <TabBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>⚠️ Security Logs</TabBtn>
        <TabBtn active={activeTab === 'boveda'} onClick={() => setActiveTab('boveda')}>👁️ Bóveda Global</TabBtn>
      </div>

      {/* Contenido Principal */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '30px', minHeight: '600px', backdropFilter: 'blur(10px)' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', color: C.gold, marginTop: '100px', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Accediendo a la matriz...</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            
            {/* VIEW: USUARIOS */}
            {activeTab === 'users' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.gold, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '15px 10px' }}>Email</th>
                    <th style={{ padding: '15px 10px' }}>Rol</th>
                    <th style={{ padding: '15px 10px' }}>Créditos IA</th>
                    <th style={{ padding: '15px 10px' }}>Estado</th>
                    <th style={{ padding: '15px 10px', textAlign: 'right' }}>Acciones Ejecutivas</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '15px 10px', fontWeight: '500' }}>{u.email}</td>
                      <td style={{ padding: '15px 10px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: u.role === 'superadmin' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', color: u.role === 'superadmin' ? C.gold : '#aaa' }}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '15px 10px', color: '#00f0ff', fontWeight: 'bold' }}>{u.ai_credits || 0}</td>
                      <td style={{ padding: '15px 10px' }}>
                        <StatusBadge status={u.account_status || 'active'} />
                      </td>
                      <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                        {u.role !== 'superadmin' && (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <ActionBtn color="cyan" onClick={() => handleModifyCredits(u.id, u.ai_credits)}>+ / - IA</ActionBtn>
                            <ActionBtn color="red" onClick={() => handleUpdateStatus(u.id, u.email, u.account_status)}>Castigar</ActionBtn>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* VIEW: LOGS DE SEGURIDAD */}
            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logs.length === 0 && <p style={{ color: C.textMuted }}>No hay anomalías registradas aún.</p>}
                {logs.map(log => (
                  <div key={log.id} style={{ padding: '15px 20px', background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#ff8888', marginRight: '15px' }}>[{log.action}]</strong>
                      <span style={{ color: '#eee', fontSize: '0.9rem' }}>{log.details}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: C.textMuted }}>
                      {new Date(log.created_at).toLocaleString('es-PE')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW: BÓVEDA GLOBAL */}
            {activeTab === 'boveda' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '15px' }}>
                  Mostrando todos los recursos de la plataforma. (Saltando restricciones de privacidad `is_public`).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {presentations.map(pres => (
                    <div key={pres.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>{pres.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: '0 0 15px' }}>Propiedad de ID: {pres.user_id.split('-')[0]}...</p>
                      <ActionBtn color="gold" onClick={() => navigate(`/editor/${pres.slug || pres.id}`)}>👁️ Inspeccionar en Editor</ActionBtn>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── UTILS UI ───

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px', fontSize: '0.9rem', fontWeight: active ? '700' : '500',
        background: active ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
        border: active ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
        color: active ? '#ffd700' : '#888',
        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: active ? '0 0 15px rgba(255,215,0,0.1)' : 'none'
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#888' }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const configs = {
    active:    { bg: 'rgba(0, 255, 128, 0.1)', color: '#00ff80', label: 'Activo' },
    suspended: { bg: 'rgba(255, 215, 0, 0.1)', color: '#ffd700', label: 'Suspendido' },
    banned:    { bg: 'rgba(255, 80, 80, 0.1)', color: '#ff5050', label: 'Baneado' },
  };
  const c = configs[status] || configs.active;
  return (
    <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: c.bg, color: c.color, border: `1px solid ${c.color}40` }}>
      {c.label}
    </span>
  );
}

function ActionBtn({ color, onClick, children }) {
  const themes = {
    cyan: 'rgba(0, 240, 255, 0.15)',
    red:  'rgba(255, 80, 80, 0.15)',
    gold: 'rgba(255, 215, 0, 0.15)'
  };
  const borderThemes = {
    cyan: 'rgba(0, 240, 255, 0.3)',
    red:  'rgba(255, 80, 80, 0.3)',
    gold: 'rgba(255, 215, 0, 0.3)'
  };
  const textThemes = {
    cyan: '#00f0ff',
    red:  '#ff8888',
    gold: '#ffd700'
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', fontSize: '11px', fontWeight: 'bold',
        background: themes[color], border: `1px solid ${borderThemes[color]}`, color: textThemes[color],
        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s'
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );
}
