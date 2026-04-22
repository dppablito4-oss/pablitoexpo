import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AdminXpPanel from '../components/AdminXpPanel';

const C = {
  bg:       '#06060d',
  cardBg:   'rgba(255, 215, 0, 0.03)',
  border:   'rgba(255, 215, 0, 0.15)',
  gold:     '#ffd700',
  textPrimary: '#e2e8f0',
  textMuted:   'rgba(255,255,255,0.4)',
};

export default function AdminPanel() {
  const [logs, setLogs] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [emailConfig, setEmailConfig] = useState({ smtp_email: '', smtp_app_password: '' });
  const [blastData, setBlastData] = useState({ target: 'ALL', subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('xp');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'logs') {
        const { data, error } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (!error && data) setLogs(data);
      } else if (activeTab === 'boveda') {
        // Modo Dios para ver todas las presentaciones gracias a la política que acabamos de agregar (bypass is_public)
        const { data, error } = await supabase.from('presentations').select('*').order('created_at', { ascending: false });
        if (!error && data) setPresentations(data);
      } else if (activeTab === 'emails') {
        const { data, error } = await supabase.from('corporate_email_settings').select('*').eq('id', 1).single();
        if (!error && data) {
          setEmailConfig({ smtp_email: data.smtp_email || '', smtp_app_password: data.smtp_app_password || '' });
        }
      }
    } catch (e) {
      console.error("Error devorando base de datos:", e);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveEmailConfig = async () => {
    if (!emailConfig.smtp_email || !emailConfig.smtp_app_password) return alert('No dejes los campos vacíos.');
    const { error } = await supabase.from('corporate_email_settings').upsert({ id: 1, smtp_email: emailConfig.smtp_email, smtp_app_password: emailConfig.smtp_app_password });
    if (!error) {
      alert('Credenciales blindadas en la bóveda de la BD.');
    } else alert('Error: ' + error.message);
  };

  const handleFireBlast = async () => {
    if (!blastData.subject || !blastData.message) return alert('Redacta tu mensaje comandante.');
    if (!window.confirm(`¿LISTO PARA DESPACHAR LA OLEADA DE CORREOS?`)) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pablito-mailer', {
         body: { action: 'MANUAL_BLAST', payload: { target: blastData.target, subject: blastData.subject, customHtml: blastData.message } }
      });
      if (error) throw error;
      alert(data?.message || 'Correos enviados exitosamente');
    } catch (e) {
      alert("Error en el hiperfoco de correo: " + e.message);
    } finally {
      setLoading(false);
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

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <TabBtn active={activeTab === 'xp'} onClick={() => setActiveTab('xp')}>👥 Habitantes & XP</TabBtn>
        <TabBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>⚠️ Security Logs</TabBtn>
        <TabBtn active={activeTab === 'boveda'} onClick={() => setActiveTab('boveda')}>👁️ Bóveda Global</TabBtn>
        <TabBtn active={activeTab === 'emails'} onClick={() => setActiveTab('emails')}>📧 Emisor Corporativo</TabBtn>
      </div>

      {/* Contenido Principal */}
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '30px', minHeight: '600px', backdropFilter: 'blur(10px)' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', color: C.gold, marginTop: '100px', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>Accediendo a la matriz...</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>


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
                    <div key={pres.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>{pres.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: C.textMuted, margin: '0 0 15px' }}>Propiedad de ID: {pres.user_id.split('-')[0]}...</p>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <ActionBtn color="cyan" onClick={() => navigate(`/projector/${pres.slug || pres.id}`)}>📺 Proyectar</ActionBtn>
                        <ActionBtn color="red" onClick={() => navigate(`/remote/${pres.slug || pres.id}`)}>📱 Láser</ActionBtn>
                      </div>
                      <ActionBtn color="gold" onClick={() => navigate(`/editor/${pres.slug || pres.id}`)}>👁️ Editar / Inspeccionar</ActionBtn>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {!loading && activeTab === 'emails' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
             
             {/* CONFIG SECTION */}
             <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '25px', borderRadius: '15px' }}>
                <h3 style={{ color: C.gold, marginTop: 0 }}>⚙️ Credenciales SMTP Seguras</h3>
                <p style={{ fontSize: '0.8rem', color: C.textMuted, marginBottom: '20px' }}>Por seguridad del sistema, ingresa una "Contraseña de Aplicaciones" oficial de Google (16 dígitos sin espacios), NUNCA tu pass global de la nube.</p>
                
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#aaa' }}>Gmail Originador:</label>
                <input 
                  type="email" value={emailConfig.smtp_email} onChange={e => setEmailConfig(p => ({...p, smtp_email: e.target.value}))}
                  style={{ width: '100%', padding: '12px', marginBottom: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} 
                  placeholder="pabloclsa87@gmail.com"
                />

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#aaa' }}>Token de Aplicación SMTP:</label>
                <input 
                  type="password" value={emailConfig.smtp_app_password} onChange={e => setEmailConfig(p => ({...p, smtp_app_password: e.target.value}))}
                  style={{ width: '100%', padding: '12px', marginBottom: '25px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', borderRadius: '8px', letterSpacing: '3px' }} 
                  placeholder="••••••••••••••••"
                />

                <button onClick={handleSaveEmailConfig} style={{ width: '100%', background: 'var(--accent-primary)', color: '#000', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
                  Blindar Credenciales
                </button>
             </div>

             {/* BLAST SECTION */}
             <div style={{ flex: '2 1 400px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${C.border}`, padding: '25px', borderRadius: '15px' }}>
                <h3 style={{ color: C.gold, marginTop: 0 }}>🚀 Transmisor Personalizado</h3>
                <p style={{ fontSize: '0.8rem', color: C.textMuted, marginBottom: '20px' }}>Usa código HTML simple para redactar tu mensaje de evento o aniversario. Cuentas con etiqueta inyectable genérica `{"{"}{"{"}NICKNAME{"}"}{"}"}`.</p>
                
                <select value={blastData.target} onChange={e => setBlastData(p=>({...p, target: e.target.value}))} style={{ width: '100%', padding: '12px', marginBottom: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', borderRadius: '8px' }}>
                   <option value="ALL">Para toda la lista de suscripción 🌍 (Todos Pablito Expo)</option>
                   <option value="TEST">Sólo Mí mismo (Modo Piloto)</option>
                </select>

                <input placeholder="Asunto (Ej: 🔥 Nuevo Editor ya disponible)" value={blastData.subject} onChange={e => setBlastData(p=>({...p, subject: e.target.value}))} style={{ width: '100%', padding: '12px', marginBottom: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} />

                <textarea placeholder="<h1>Amigos!</h1><p>Les deseo feliz navidad.</p>" value={blastData.message} onChange={e => setBlastData(p=>({...p, message: e.target.value}))} style={{ width: '100%', height: '200px', padding: '12px', marginBottom: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', resize: 'vertical' }} />

                <button onClick={handleFireBlast} style={{ width: '100%', background: '#fff', color: '#000', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 5px 15px rgba(255,255,255,0.2)' }}>
                  ☄️ Iniciar Despliegue SMTP Masivo
                </button>
             </div>

           </motion.div>
        )}

        {!loading && activeTab === 'xp' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AdminXpPanel />
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
