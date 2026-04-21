/**
 * AdminXpPanel.jsx — Panel de control XP/HP para el Admin Panel (v2)
 * 
 * Todo editable desde la UI: ON/OFF, multiplicador, costos HP,
 * valores XP por acción, umbrales de nivel y control por usuario.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { getLevelInfo, getLevelFromXP, DEFAULT_LEVEL_THRESHOLDS, DEFAULT_RANK_NAMES, DEFAULT_HP_COSTS, XP_ACTIONS } from '../lib/xpService';
import { motion } from 'framer-motion';

const C = {
  gold: '#ffd700', cyan: '#00f0ff', green: '#10b981',
  red: '#ef4444', purple: '#a855f7', textMuted: 'rgba(255,255,255,0.4)',
  card: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)',
};

// Etiquetas legibles para cada clave de HP
const HP_LABELS = {
  brayan: '🧢 El Brayan',
  renegon: '⚡ El Renegón',
  catedratico: '🎓 Catedrático',
  cientifico: '⚛️ Científico',
  motivador: '🚀 Motivador',
  image_mini: '🖼️ Imagen Mini',
  image_pro: '🎨 Imagen Pro',
};

export default function AdminXpPanel() {
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('global'); // global | hp | xp | users

  // Estado local editable de la config
  const [editHpCosts, setEditHpCosts] = useState({});
  const [editThresholds, setEditThresholds] = useState([]);
  const [editRankNames, setEditRankNames] = useState([]);
  const [editMultiplier, setEditMultiplier] = useState(1.0);
  const [editEnabled, setEditEnabled] = useState(true);

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

      const { data: usersData } = await supabase.from('profiles').select('id, email, role, xp, level, hp').order('xp', { ascending: false });
      if (usersData) setUsers(usersData);
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar config global ──────────────────────────────────────────────────
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
      await logAction('XP_CONFIG_UPDATED', 'Configuración global de XP/HP actualizada desde el Admin Panel.');
      alert('✅ Configuración guardada correctamente.');
    } else {
      alert('❌ Error al guardar: ' + error.message);
    }
    setSaving(false);
  };

  // ── Acciones sobre usuarios individuales ──────────────────────────────────
  const handleModifyXP = async (userId, email, currentXP) => {
    const amount = parseInt(prompt(`Usuario: ${email}\nXP actual: ${currentXP || 0}\n\nCantidad a SUMAR (usa negativos para restar):`), 10);
    if (isNaN(amount)) return;
    const newXP = Math.max(0, (currentXP || 0) + amount);
    const newLevel = getLevelFromXP(newXP, editThresholds.map(Number));
    const { error } = await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', userId);
    if (!error) {
      await logAction('XP_MODIFIED', `XP de ${email}: ${amount > 0 ? '+' : ''}${amount}. Total: ${newXP}. Nivel: ${newLevel}.`);
      loadData();
    } else alert('Error: ' + error.message);
  };

  const handleModifyHP = async (userId, email, currentHP) => {
    const amount = parseInt(prompt(`Usuario: ${email}\nHP actual: ${currentHP || 0}\n\nCantidad a SUMAR (usa negativos para restar):`), 10);
    if (isNaN(amount)) return;
    const newHP = Math.max(0, (currentHP || 0) + amount);
    const { error } = await supabase.from('profiles').update({ hp: newHP }).eq('id', userId);
    if (!error) {
      await logAction('HP_MODIFIED', `HP de ${email}: ${amount > 0 ? '+' : ''}${amount}. Total: ${newHP}.`);
      loadData();
    } else alert('Error: ' + error.message);
  };

  const logAction = async (action, details) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('security_logs').insert([{ action, details, user_id: user?.id }]);
  };

  if (loading) return <div style={{ textAlign: 'center', color: C.gold, marginTop: '60px', fontSize: '1.1rem' }}>Cargando sistema de gamificación...</div>;

  const thresholds = config?.level_thresholds || DEFAULT_LEVEL_THRESHOLDS;
  const rankNames = config?.rank_names || DEFAULT_RANK_NAMES;

  // Tabs internas del panel XP
  const TABS = [
    { id: 'global', label: '⚙️ Global' },
    { id: 'hp', label: '⚡ Costos HP' },
    { id: 'xp', label: '⭐ Niveles' },
    { id: 'users', label: '👥 Usuarios' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)} style={{
            padding: '8px 18px', fontSize: '12px', fontWeight: '700',
            background: activeSection === t.id ? 'rgba(255,215,0,0.1)' : 'transparent',
            border: activeSection === t.id ? '1px solid rgba(255,215,0,0.35)' : `1px solid ${C.border}`,
            color: activeSection === t.id ? C.gold : C.textMuted,
            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
        {/* Botón guardar siempre visible */}
        <button onClick={saveConfig} disabled={saving} style={{
          marginLeft: 'auto', padding: '8px 20px', fontSize: '12px', fontWeight: '800',
          background: saving ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.35)', color: C.green,
          borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        }}>
          {saving ? '⏳ Guardando...' : '💾 Guardar Todo'}
        </button>
      </div>

      {/* ── SECCIÓN: GLOBAL ── */}
      {activeSection === 'global' && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Kill-switch */}
          <div style={{ flex: '1 1 260px', padding: '20px', borderRadius: '14px', background: editEnabled ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${editEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: editEnabled ? C.green : C.red, fontSize: '0.95rem' }}>
                {editEnabled ? '🟢 Sistema XP Activo' : '🔴 Sistema XP Pausado'}
              </h4>
              <button onClick={() => setEditEnabled(v => !v)} style={{
                padding: '6px 16px', fontSize: '11px', fontWeight: '700',
                background: editEnabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${editEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: editEnabled ? C.red : C.green, borderRadius: '8px', cursor: 'pointer',
              }}>{editEnabled ? 'PAUSAR' : 'ACTIVAR'}</button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: C.textMuted }}>Al pausar, ninguna acción otorgará XP ni consumirá HP. Los valores actuales se mantienen.</p>
          </div>

          {/* Multiplicador */}
          <div style={{ flex: '1 1 260px', padding: '20px', borderRadius: '14px', background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.15)' }}>
            <h4 style={{ margin: '0 0 12px', color: C.gold, fontSize: '0.95rem' }}>⚡ Multiplicador XP Global</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number" min="0" step="0.1" value={editMultiplier}
                onChange={e => setEditMultiplier(e.target.value)}
                style={{ width: '80px', padding: '8px', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.3)', color: C.gold, borderRadius: '8px' }}
              />
              <span style={{ color: C.gold, fontSize: '1.1rem', fontWeight: '800' }}>x</span>
              <span style={{ fontSize: '0.78rem', color: C.textMuted }}>
                {parseFloat(editMultiplier) > 1 ? '🎉 Evento doble XP activo' : parseFloat(editMultiplier) < 1 ? '⚠️ XP reducido' : '✅ Normal'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: COSTOS HP ── */}
      {activeSection === 'hp' && (
        <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.1)' }}>
          <h4 style={{ margin: '0 0 6px', color: C.cyan, fontSize: '0.95rem' }}>⚡ Costos de HP por Acción de IA</h4>
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: C.textMuted }}>Define cuánto HP consume cada personalidad o acción. Recuerda presionar "Guardar Todo" arriba.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {Object.entries(editHpCosts).map(([key, cost]) => (
              <div key={key} style={{ padding: '14px 16px', background: C.card, border: C.border, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                  {HP_LABELS[key] || key}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: C.textMuted, fontSize: '11px' }}>-</span>
                  <input
                    type="number" min="0" value={cost}
                    onChange={e => setEditHpCosts(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ width: '55px', padding: '5px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: C.cyan, borderRadius: '7px' }}
                  />
                  <span style={{ color: C.cyan, fontSize: '11px', fontWeight: '700' }}>HP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECCIÓN: NIVELES / RANGOS ── */}
      {activeSection === 'xp' && (
        <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(168,85,247,0.02)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <h4 style={{ margin: '0 0 6px', color: C.purple, fontSize: '0.95rem' }}>🏆 Umbrales de Nivel y Nombres de Rango</h4>
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: C.textMuted }}>Edita el XP mínimo para cada nivel y el nombre del rango. Son 6 niveles (0–5).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {editThresholds.map((threshold, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textMuted, width: '50px', flexShrink: 0 }}>Nv. {i}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <input
                    type="number" min="0" value={threshold}
                    onChange={e => setEditThresholds(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    style={{ width: '80px', padding: '5px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '800', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: C.purple, borderRadius: '7px' }}
                  />
                  <span style={{ color: C.textMuted, fontSize: '11px' }}>XP</span>
                </div>
                <input
                  type="text" value={editRankNames[i] || ''}
                  placeholder={`Nombre Nivel ${i}`}
                  onChange={e => setEditRankNames(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '13px', fontWeight: '700', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: '#e2e8f0', borderRadius: '7px' }}
                />
                <span style={{ fontSize: '16px' }}>{['🌱','📘','🎨','⚡','🔥','👑'][i] || '⭐'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECCIÓN: USUARIOS ── */}
      {activeSection === 'users' && (
        <div>
          <h4 style={{ margin: '0 0 14px', color: '#e2e8f0', fontSize: '0.95rem' }}>👥 Habitantes — XP y HP Individual</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,215,0,0.15)', color: C.gold, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Rango</th>
                  <th style={{ padding: '12px 10px' }}>XP</th>
                  <th style={{ padding: '12px 10px' }}>HP</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const info = getLevelInfo(u.level || 0, rankNames);
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 10px', fontSize: '0.83rem', fontWeight: '500' }}>{u.email}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}>
                          {info.emoji} {info.name} <span style={{ opacity: 0.6 }}>Nv.{info.level}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: C.purple, fontWeight: 'bold', fontSize: '0.85rem' }}>{u.xp || 0}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        <span style={{ color: (u.hp || 0) > 20 ? C.green : (u.hp || 0) > 0 ? '#f59e0b' : C.red }}>
                          ⚡ {u.hp || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        {u.role !== 'superadmin' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <MiniBtn color={C.purple} onClick={() => handleModifyXP(u.id, u.email, u.xp)}>+/- XP</MiniBtn>
                            <MiniBtn color={C.cyan} onClick={() => handleModifyHP(u.id, u.email, u.hp)}>+/- HP</MiniBtn>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>No hay usuarios registrados aún.</td></tr>
                )}
              </tbody>
            </table>
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
