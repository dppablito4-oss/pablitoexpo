/**
 * AdminXpPanel.jsx — Panel Unificado: Usuarios + XP + Créditos + Estado
 */
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { getLevelInfo, getLevelFromXP, DEFAULT_LEVEL_THRESHOLDS, DEFAULT_RANK_NAMES, DEFAULT_HP_COSTS } from '../lib/xpService';
import { motion } from 'framer-motion';
import { C as baseC } from '../config/theme';

const C = { ...baseC, gold: '#ffd700', green: '#10b981', red: '#ef4444', card: 'rgba(255,255,255,0.02)' };


const HP_LABELS = {
  brayan: '🧢 El Brayan', renegon: '⚡ El Renegón', catedratico: '🎓 Catedrático',
  cientifico: '⚛️ Científico', motivador: '🚀 Motivador',
  image_mini: '🖼️ Imagen Mini', image_pro: '🎨 Imagen Pro',
};

const STATUS_CONFIGS = {
  active:    { bg: 'rgba(0,255,128,0.1)', color: '#00ff80', label: 'Activo' },
  suspended: { bg: 'rgba(255,215,0,0.1)', color: '#ffd700', label: 'Suspendido' },
  banned:    { bg: 'rgba(255,80,80,0.1)', color: '#ff5050', label: 'Baneado' },
};

export default function AdminXpPanel() {
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable config state
  const [editHpCosts, setEditHpCosts] = useState({});
  const [editThresholds, setEditThresholds] = useState([]);
  const [editRankNames, setEditRankNames] = useState([]);
  const [editMultiplier, setEditMultiplier] = useState(1.0);
  const [editEnabled, setEditEnabled] = useState(true);

  // Inline editing state
  const [editingCredits, setEditingCredits] = useState({});
  const [editingXP, setEditingXP] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cfgData } = await supabase.from('xp_config').select('*').eq('id', 1).single();
      const cfg = cfgData ? {
        enabled: cfgData.enabled ?? true,
        xp_multiplier: parseFloat(cfgData.xp_multiplier) || 1.0,
        level_thresholds: typeof cfgData.level_thresholds === 'string' ? JSON.parse(cfgData.level_thresholds) : (cfgData.level_thresholds || DEFAULT_LEVEL_THRESHOLDS),
        rank_names: typeof cfgData.rank_names === 'string' ? JSON.parse(cfgData.rank_names) : (cfgData.rank_names || DEFAULT_RANK_NAMES),
        hp_costs: typeof cfgData.hp_costs === 'string' ? JSON.parse(cfgData.hp_costs) : (cfgData.hp_costs || DEFAULT_HP_COSTS),
      } : { enabled: true, xp_multiplier: 1.0, level_thresholds: DEFAULT_LEVEL_THRESHOLDS, rank_names: DEFAULT_RANK_NAMES, hp_costs: DEFAULT_HP_COSTS };

      setConfig(cfg);
      setEditEnabled(cfg.enabled);
      setEditMultiplier(cfg.xp_multiplier);
      setEditHpCosts({ ...cfg.hp_costs });
      setEditThresholds([...cfg.level_thresholds]);
      setEditRankNames([...cfg.rank_names]);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, username, role, xp, level, ai_credits, account_status')
        .order('xp', { ascending: false });
      if (usersData) setUsers(usersData);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const payload = {
      enabled: editEnabled,
      xp_multiplier: parseFloat(editMultiplier) || 1.0,
      level_thresholds: editThresholds.map(Number),
      rank_names: editRankNames,
      hp_costs: Object.fromEntries(Object.entries(editHpCosts).map(([k, v]) => [k, parseInt(v) || 0])),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('xp_config').update(payload).eq('id', 1);
    if (!error) {
      setConfig(prev => ({ ...prev, ...payload }));
      await logAction('XP_CONFIG_UPDATED', 'Configuración global actualizada.');
      alert('✅ Configuración guardada.');
    } else alert('❌ Error: ' + error.message);
    setSaving(false);
  };

  const handleSaveCredits = async (userId, val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) return alert('Valor inválido.');
    const { data, error } = await supabase.from('profiles').update({ ai_credits: parsed }).eq('id', userId).select('ai_credits');
    if (error) return alert('Error BD: ' + error.message);
    if (!data || data.length === 0) {
      alert('⚠️ No se pudo actualizar. Verifica que la política RLS permita al admin editar perfiles ajenos.');
      return;
    }
    await logAction('CREDITS_MODIFIED', `Créditos IA → ${parsed} para ${userId}`);
    setEditingCredits(p => { const n={...p}; delete n[userId]; return n; });
    // Actualizar localmente sin recargar la página
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ai_credits: parsed } : u));
  };

  const handleSaveXP = async (userId, val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) return alert('Valor inválido.');
    const newLevel = getLevelFromXP(parsed, editThresholds.map(Number));
    const { data, error } = await supabase.from('profiles').update({ xp: parsed, level: newLevel }).eq('id', userId).select('xp, level');
    if (error) return alert('Error BD: ' + error.message);
    if (!data || data.length === 0) {
      alert('⚠️ No se pudo actualizar el XP. Verifica la política RLS en la tabla profiles.');
      return;
    }
    await logAction('XP_MODIFIED', `XP → ${parsed}, Nivel → ${newLevel} para ${userId}`);
    setEditingXP(p => { const n={...p}; delete n[userId]; return n; });
    // Actualizar localmente sin recargar la página
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, xp: parsed, level: newLevel } : u));
  };

  const handleUpdateStatus = async (userId, email, currentStatus) => {
    const valid = ['active', 'suspended', 'banned'];
    const next = valid[(valid.indexOf(currentStatus || 'active') + 1) % valid.length];
    if (!window.confirm(`¿Cambiar estado de ${email} a ${next.toUpperCase()}?`)) return;
    const { error } = await supabase.from('profiles').update({ account_status: next }).eq('id', userId);
    if (!error) { await logAction('STATUS_CHANGED', `${email} → ${next}`); loadData(); }
  };

  const logAction = async (action, details) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('security_logs').insert([{ action, details, user_id: user?.id }]);
  };

  if (loading) return <div style={{ textAlign: 'center', color: C.gold, marginTop: '60px' }}>Cargando sistema...</div>;

  const rankNames = config?.rank_names || DEFAULT_RANK_NAMES;
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return !q || (u.email || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const TABS = [
    { id: 'users', label: '👥 Habitantes' },
    { id: 'global', label: '⚙️ Global' },
    { id: 'hp', label: '⚡ Costos por Personalidad' },
    { id: 'xp', label: '⭐ Niveles' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)} style={{
            padding: '8px 18px', fontSize: '12px', fontWeight: '700',
            background: activeSection === t.id ? 'rgba(255,215,0,0.1)' : 'transparent',
            border: activeSection === t.id ? '1px solid rgba(255,215,0,0.35)' : `1px solid ${C.border}`,
            color: activeSection === t.id ? C.gold : C.textMuted,
            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
        {activeSection !== 'users' && (
          <button onClick={saveConfig} disabled={saving} style={{
            marginLeft: 'auto', padding: '8px 20px', fontSize: '12px', fontWeight: '800',
            background: saving ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.35)', color: C.green,
            borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
          }}>{saving ? '⏳ Guardando...' : '💾 Guardar Config'}</button>
        )}
      </div>

      {/* ── USUARIOS UNIFICADOS ── */}
      {activeSection === 'users' && (
        <div>
          {/* Barra de búsqueda */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text" placeholder="🔍 Buscar por nombre o correo..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '10px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: '#fff', borderRadius: '10px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,215,0,0.15)', color: C.gold, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 10px' }}>Usuario</th>
                  <th style={{ padding: '12px 10px' }}>Rango</th>
                  <th style={{ padding: '12px 10px' }}>XP</th>
                  <th style={{ padding: '12px 10px' }}>Créditos IA</th>
                  <th style={{ padding: '12px 10px' }}>Estado</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const info = getLevelInfo(u.level || 0, rankNames);
                  const st = STATUS_CONFIGS[u.account_status || 'active'] || STATUS_CONFIGS.active;
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Nickname + Email */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{u.username || '—'}</div>
                        <div style={{ fontSize: '11px', color: C.textMuted }}>{u.email}</div>
                        {u.role === 'superadmin' && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,215,0,0.2)', color: C.gold, fontWeight: '800' }}>ADMIN</span>}
                      </td>
                      {/* Rango */}
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}>
                          {info.emoji} {info.name} <span style={{ opacity: 0.6 }}>Nv.{info.level}</span>
                        </span>
                      </td>
                      {/* XP editable */}
                      <td style={{ padding: '12px 10px', color: C.purple, fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {editingXP[u.id] !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="number" min="0" value={editingXP[u.id]} autoFocus
                              onChange={e => setEditingXP(p => ({ ...p, [u.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key==='Enter') handleSaveXP(u.id, editingXP[u.id]); if (e.key==='Escape') setEditingXP(p => { const n={...p}; delete n[u.id]; return n; }); }}
                              style={{ width: '65px', padding: '4px', textAlign: 'center', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: C.purple, borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}
                            />
                            <MiniBtn color={C.green} onClick={() => handleSaveXP(u.id, editingXP[u.id])}>✓</MiniBtn>
                          </div>
                        ) : (
                          <span onClick={() => setEditingXP(p => ({ ...p, [u.id]: u.xp ?? 0 }))} style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(168,85,247,0.4)' }}>{u.xp || 0}</span>
                        )}
                      </td>
                      {/* Créditos IA editable */}
                      <td style={{ padding: '12px 10px', color: C.cyan, fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {editingCredits[u.id] !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="number" min="0" value={editingCredits[u.id]} autoFocus
                              onChange={e => setEditingCredits(p => ({ ...p, [u.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key==='Enter') handleSaveCredits(u.id, editingCredits[u.id]); if (e.key==='Escape') setEditingCredits(p => { const n={...p}; delete n[u.id]; return n; }); }}
                              style={{ width: '65px', padding: '4px', textAlign: 'center', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: C.cyan, borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}
                            />
                            <MiniBtn color={C.green} onClick={() => handleSaveCredits(u.id, editingCredits[u.id])}>✓</MiniBtn>
                          </div>
                        ) : (
                          <span onClick={() => setEditingCredits(p => ({ ...p, [u.id]: u.ai_credits ?? 0 }))} style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(0,240,255,0.4)' }}>⚡ {u.ai_credits ?? 0}</span>
                        )}
                      </td>
                      {/* Estado */}
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>{st.label}</span>
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        {u.role !== 'superadmin' && (
                          <MiniBtn color={C.red} onClick={() => handleUpdateStatus(u.id, u.email, u.account_status)}>
                            {(u.account_status || 'active') === 'active' ? '⛔ Suspender' : '✅ Activar'}
                          </MiniBtn>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>No se encontraron usuarios.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GLOBAL ── */}
      {activeSection === 'global' && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', padding: '20px', borderRadius: '14px', background: editEnabled ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${editEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: editEnabled ? C.green : C.red, fontSize: '0.95rem' }}>
                {editEnabled ? '🟢 Sistema Activo' : '🔴 Sistema Pausado'}
              </h4>
              <button onClick={() => setEditEnabled(v => !v)} style={{
                padding: '6px 16px', fontSize: '11px', fontWeight: '700',
                background: editEnabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${editEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: editEnabled ? C.red : C.green, borderRadius: '8px', cursor: 'pointer',
              }}>{editEnabled ? 'PAUSAR' : 'ACTIVAR'}</button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: C.textMuted }}>Al pausar, ninguna acción otorgará XP ni consumirá créditos.</p>
          </div>
          <div style={{ flex: '1 1 260px', padding: '20px', borderRadius: '14px', background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.15)' }}>
            <h4 style={{ margin: '0 0 12px', color: C.gold, fontSize: '0.95rem' }}>⚡ Multiplicador XP</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="number" min="0" step="0.1" value={editMultiplier} onChange={e => setEditMultiplier(e.target.value)}
                style={{ width: '80px', padding: '8px', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.3)', color: C.gold, borderRadius: '8px' }}
              />
              <span style={{ color: C.gold, fontSize: '1.1rem', fontWeight: '800' }}>x</span>
              <span style={{ fontSize: '0.78rem', color: C.textMuted }}>
                {parseFloat(editMultiplier) > 1 ? '🎉 Evento doble XP' : parseFloat(editMultiplier) < 1 ? '⚠️ XP reducido' : '✅ Normal'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── COSTOS POR PERSONALIDAD ── */}
      {activeSection === 'hp' && (
        <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.1)' }}>
          <h4 style={{ margin: '0 0 6px', color: C.cyan, fontSize: '0.95rem' }}>⚡ Créditos consumidos por cada personalidad de IA</h4>
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: C.textMuted }}>Define cuántos créditos consume cada consulta. Presiona "Guardar Config" arriba.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {Object.entries(editHpCosts).map(([key, cost]) => (
              <div key={key} style={{ padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{HP_LABELS[key] || key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="number" min="0" value={cost} onChange={e => setEditHpCosts(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '55px', padding: '5px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: C.cyan, borderRadius: '7px' }}
                  />
                  <span style={{ color: C.cyan, fontSize: '11px', fontWeight: '700' }}>crd</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NIVELES ── */}
      {activeSection === 'xp' && (
        <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(168,85,247,0.02)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <h4 style={{ margin: '0 0 6px', color: C.purple, fontSize: '0.95rem' }}>🏆 Umbrales de Nivel y Rangos</h4>
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: C.textMuted }}>Edita el XP mínimo y nombre de cada rango (6 niveles, 0–5).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {editThresholds.map((threshold, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textMuted, width: '50px', flexShrink: 0 }}>Nv. {i}</span>
                <input type="number" min="0" value={threshold} onChange={e => setEditThresholds(p => p.map((v, idx) => idx === i ? e.target.value : v))}
                  style={{ width: '80px', padding: '5px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: C.purple, borderRadius: '7px' }}
                />
                <span style={{ color: C.textMuted, fontSize: '11px' }}>XP</span>
                <input type="text" value={editRankNames[i] || ''} placeholder={`Rango ${i}`} onChange={e => setEditRankNames(p => p.map((v, idx) => idx === i ? e.target.value : v))}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '13px', fontWeight: '700', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: '#e2e8f0', borderRadius: '7px' }}
                />
                <span style={{ fontSize: '16px' }}>{['🌱','📘','🎨','⚡','🔥','👑'][i] || '⭐'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MiniBtn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', fontSize: '10px', fontWeight: '700',
      background: `${color}15`, border: `1px solid ${color}30`, color,
      borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >{children}</button>
  );
}
