/**
 * XpWidget.jsx — Widget compacto de XP/Nivel para el sidebar del Dashboard
 * 
 * Props: xp, level, config (de fetchXpConfig)
 * Se renderiza en el sidebar sin tocar la lógica de Dashboard.
 */
import { getLevelInfo, getProgressPercent, getXpForNextLevel, DEFAULT_LEVEL_THRESHOLDS, DEFAULT_RANK_NAMES } from '../lib/xpService';

// Intentar importar iconos de rango personalizados
// Si no existen aún, el fallback emoji del getLevelInfo se usa automáticamente
const rankIcons = {};
try {
  rankIcons[0] = new URL('../assets/ranks/rank_0_cachumbo.png', import.meta.url).href;
  rankIcons[1] = new URL('../assets/ranks/rank_1_aprendiz.png', import.meta.url).href;
  rankIcons[2] = new URL('../assets/ranks/rank_2_creador.png', import.meta.url).href;
  rankIcons[3] = new URL('../assets/ranks/rank_3_experto.png', import.meta.url).href;
  rankIcons[4] = new URL('../assets/ranks/rank_4_patron.png', import.meta.url).href;
  rankIcons[5] = new URL('../assets/ranks/rank_5_leyenda.png', import.meta.url).href;
} catch (_) {
  // Los iconos aún no han sido subidos, se usarán emojis
}

export default function XpWidget({ xp = 0, level = 0, config = null, hp = 0 }) {
  const thresholds = config?.level_thresholds || DEFAULT_LEVEL_THRESHOLDS;
  const rankNames = config?.rank_names || DEFAULT_RANK_NAMES;

  const info = getLevelInfo(level, rankNames);
  const progress = getProgressPercent(xp, thresholds);
  const nextXp = getXpForNextLevel(xp, thresholds);
  const isMaxLevel = level >= thresholds.length - 1;
  const hasCustomIcon = rankIcons[level];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${info.color}30`,
      borderRadius: '12px',
      padding: '12px',
      marginBottom: '10px',
    }}>
      {/* Rango + Nivel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {hasCustomIcon ? (
          <img
            src={rankIcons[level]}
            alt={info.name}
            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
          />
        ) : null}
        <span style={{ fontSize: '16px', display: hasCustomIcon ? 'none' : 'inline' }}>{info.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: info.color,
            letterSpacing: '0.04em',
          }}>
            {info.name}
            <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '500', marginLeft: '6px' }}>
              Nv.{info.level}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{
        height: '6px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '6px',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${info.color}, ${info.color}99)`,
          borderRadius: '3px',
          transition: 'width 0.6s ease-out',
        }} />
      </div>

      {/* XP texto */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
          {isMaxLevel ? `${xp} XP — ¡Nivel Máximo!` : `${xp} / ${nextXp} XP`}
        </span>
        {/* HP Badge */}
        <span style={{
          fontSize: '9px',
          fontWeight: '700',
          color: hp > 20 ? '#10b981' : hp > 0 ? '#f59e0b' : '#ef4444',
          background: hp > 20 ? 'rgba(16,185,129,0.1)' : hp > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${hp > 20 ? 'rgba(16,185,129,0.2)' : hp > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          ⚡ {hp} HP
        </span>
      </div>
    </div>
  );
}
