/**
 * AdminXpPanel.jsx — Panel de control XP/HP para el Admin Panel
 * 
 * Se importa como un componente independiente en AdminPanel.jsx.
 * Permite: pausar/activar XP, ajustar multiplicador, modificar XP/HP de usuarios.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { getLevelInfo, getLevelFromXP, DEFAULT_LEVEL_THRESHOLDS, DEFAULT_RANK_NAMES, DEFAULT_HP_COSTS } from '../lib/xpService';
import { motion } from 'framer-motion';

const C = {
  gold: '#ffd700',
  cyan: '#00f0ff',
  green: '#10b981',
  red: '#ef4444',
  textMuted: 'rgba(255,255,255,0.4)',
};

export default function AdminXpPanel() {
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Config global
      const { data: cfgData } = await supabase.from('xp_config').select('*').eq('id', 1).single();
      if (cfgData) {
        setConfig({
          enabled: cfgData.enabled ?? true,
          xp_multiplier: parseFloat(cfgData.xp_multiplier) || 1.0,
          level_thresholds: typeof cfgData.level_thresholds === 'string'
            ? JSON.parse(cfgData.level_thresholds) : cfgData.level_thresholds || DEFAULT_LEVEL_THRESHOLDS,
          rank_names: typeof cfgData.rank_names === 'string'
            ? JSON.parse(cfgData.rank_names) : cfgData.rank_names || DEFAULT_RANK_NAMES,
          hp_costs: typeof cfgData.hp_costs === 'string'
            ? JSON.parse(cfgData.hp_costs) : cfgData.hp_costs || DEFAULT_HP_COSTS,
        });
      } else {
        setConfig({
          enabled: true, xp_multiplier: 1.0,
          level_thresholds: DEFAULT_LEVEL_THRESHOLDS,
          rank_names: DEFAULT_RANK_NAMES,
          hp_costs: DEFAULT_HP_COSTS,
        });
      }

      // Usuarios
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, role, xp, level, hp')
        .order('xp', { ascending: false });
      if (usersData) setUsers(usersData);
    } catch (e) {
      console.error('AdminXpPanel: Error cargando data:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Toggles y Controles Globales ──────────────────────────────────────────

  const handleToggleSystem = async () => {
    if (!config) return;
    const newVal = !config.enabled;
    setSaving(true);
    const { error } = await supabase.from('xp_config').update({ enabled: newVal, updated_at: new Date().toISOString() }).eq('id', 1);
    if (!error) {
      setConfig(prev => ({ ...prev, enabled: newVal }));
      await supabase.from('security_logs').insert([{
        action: 'XP_SYSTEM_TOGGLE',
        details: `Sistema XP ${newVal ? 'ACTIVADO' : 'DESACTIVADO'} por el administrador.`,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }]);
    }
    setSaving(false);
  };

  const handleMultiplierChange = async () => {
    const val = prompt(`Multiplicador actual: ${config?.xp_multiplier}x\n\nIngresa el nuevo multiplicador (ej: 1.0 normal, 2.0 doble XP, 0.5 mitad):`, config?.xp_multiplier);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;

    const { error } = await supabase.from('xp_config').update({ xp_multiplier: num, updated_at: new Date().toISOString() }).eq('id', 1);
    if (!error) {
      setConfig(prev => ({ ...prev, xp_multiplier: num }));
      await supabase.from('security_logs').insert([{
        action: 'XP_MULTIPLIER_CHANGED',
        details: `Multiplicador XP cambiado a ${num}x.`,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }]);
    }
  };

  // ── Acciones sobre usuarios individuales ──────────────────────────────────

  const handleModifyXP = async (userId, email, currentXP) => {
    const amount = parseInt(prompt(`Usuario: ${email}\nXP actual: ${currentXP || 0}\n\nCantidad a SUMAR (usa negativos para restar):`), 10);
    if (isNaN(amount)) return;

    const newXP = Math.max(0, (currentXP || 0) + amount);
    const newLevel = getLevelFromXP(newXP, config?.level_thresholds || DEFAULT_LEVEL_THRESHOLDS);

    const { error } = await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', userId);
    if (!error) {
      await supabase.from('security_logs').insert([{
        action: 'XP_MODIFIED',
        details: `XP de ${email}: ${amount > 0 ? '+' : ''}${amount}. Total: ${newXP}. Nivel: ${newLevel}.`,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }]);
      loadData();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleModifyHP = async (userId, email, currentHP) => {
    const amount = parseInt(prompt(`Usuario: ${email}\nHP actual: ${currentHP || 0}\n\nCantidad a SUMAR (usa negativos para restar):`), 10);
    if (isNaN(amount)) return;

    const newHP = Math.max(0, (currentHP || 0) + amount);

    const { error } = await supabase.from('profiles').update({ hp: newHP }).eq('id', userId);
    if (!error) {
      await supabase.from('security_logs').insert([{
        action: 'HP_MODIFIED',
        details: `HP de ${email}: ${amount > 0 ? '+' : ''}${amount}. Total: ${newHP}.`,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }]);
      loadData();
    } else {
      alert('Error: ' + error.message);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ textAlign: 'center', color: C.gold, marginTop: '60px', fontSize: '1.1rem' }}>Cargando sistema de gamificación...</div>;
  }

  const thresholds = config?.level_thresholds || DEFAULT_LEVEL_THRESHOLDS;
  const rankNames = config?.rank_names || DEFAULT_RANK_NAMES;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* ── CONTROLES GLOBALES ── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* Switch ON/OFF */}
        <div style={{
          flex: '1 1 250px', padding: '20px', borderRadius: '14px',
          background: config?.enabled ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
          border: `1px solid ${config?.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: config?.enabled ? C.green : C.red, fontSize: '0.95rem' }}>
              {config?.enabled ? '🟢 Sistema XP Activo' : '🔴 Sistema XP Pausado'}
            </h4>
            <button
              onClick={handleToggleSystem}
              disabled={saving}
              style={{
                padding: '6px 16px', fontSize: '11px', fontWeight: '700',
                background: config?.enabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${config?.enabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                color: config?.enabled ? C.red : C.green,
                borderRadius: '8px', cursor: 'pointer',
              }}
            >
              {config?.enabled ? 'PAUSAR' : 'ACTIVAR'}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: C.textMuted }}>
            Al pausar, ninguna acción otorgará XP. Los niveles y HP actuales se mantienen.
          </p>
        </div>

        {/* Multiplicador */}
        <div style={{
          flex: '1 1 250px', padding: '20px', borderRadius: '14px',
          background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.15)',
        }}>
          <h4 style={{ margin: '0 0 12px', color: C.gold, fontSize: '0.95rem' }}>⚡ Multiplicador XP</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '2rem', fontWeight: '900', color: C.gold,
              textShadow: config?.xp_multiplier > 1 ? '0 0 15px rgba(255,215,0,0.4)' : 'none',
            }}>
              {config?.xp_multiplier}x
            </span>
            <button
              onClick={handleMultiplierChange}
              style={{
                padding: '6px 14px', fontSize: '11px', fontWeight: '700',
                background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
                color: C.gold, borderRadius: '8px', cursor: 'pointer',
              }}
            >
              Cambiar
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: C.textMuted }}>
            {config?.xp_multiplier > 1 ? '🎉 ¡Evento de bonificación activo!' : 'Normal. Pon 2.0 para evento doble XP.'}
          </p>
        </div>
      </div>

      {/* ── TABLA DE COSTOS HP ── */}
      <div style={{
        padding: '20px', borderRadius: '14px',
        background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.1)',
      }}>
        <h4 style={{ margin: '0 0 14px', color: C.cyan, fontSize: '0.95rem' }}>⚡ Tabla de Costos HP (Solo lectura)</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {config?.hp_costs && Object.entries(config.hp_costs).map(([key, cost]) => (
            <span key={key} style={{
              padding: '6px 12px', fontSize: '11px', fontWeight: '600',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
            }}>
              {key}: <span style={{ color: C.cyan, fontWeight: '800' }}>-{cost} HP</span>
            </span>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: C.textMuted }}>
          Para modificar los costos, edita hp_costs en la tabla xp_config de Supabase directamente.
        </p>
      </div>

      {/* ── TABLA DE USUARIOS ── */}
      <div>
        <h4 style={{ margin: '0 0 14px', color: '#e2e8f0', fontSize: '0.95rem' }}>👥 Habitantes — XP y HP</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,215,0,0.15)', color: C.gold, fontSize: '0.8rem', textTransform: 'uppercase' }}>
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
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: '500' }}>{u.email}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                      background: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30`,
                    }}>
                      {info.emoji} {info.name} <span style={{ opacity: 0.6 }}>Nv.{info.level}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#a855f7', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {u.xp || 0}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    <span style={{ color: (u.hp || 0) > 20 ? C.green : (u.hp || 0) > 0 ? '#f59e0b' : C.red }}>
                      ⚡ {u.hp || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {u.role !== 'superadmin' && (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <MiniBtn color="#a855f7" onClick={() => handleModifyXP(u.id, u.email, u.xp)}>+/- XP</MiniBtn>
                        <MiniBtn color={C.cyan} onClick={() => handleModifyHP(u.id, u.email, u.hp)}>+/- HP</MiniBtn>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Botón interno ──
function MiniBtn({ color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', fontSize: '10px', fontWeight: '700',
        background: `${color}15`, border: `1px solid ${color}30`, color,
        borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );
}
