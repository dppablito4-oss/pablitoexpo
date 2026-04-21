/**
 * xpService.js — Motor de Gamificación de Pablito Expo
 * 
 * Toda la lógica de XP, niveles, rangos y HP vive aquí.
 * Ningún otro archivo calcula niveles ni descuenta HP directamente.
 */

// ─── CONFIGURACIÓN DE RANGOS (Fallback si la BD no responde) ─────────────────

export const DEFAULT_LEVEL_THRESHOLDS = [0, 50, 150, 350, 600, 1000];
export const DEFAULT_RANK_NAMES = ['Cachumbo', 'Aprendiz', 'Creador', 'Experto', 'Patrón', 'Leyenda'];
export const FALLBACK_EMOJIS = ['🌱', '📘', '🎨', '⚡', '🔥', '👑'];
export const RANK_COLORS = [
  'rgba(255,255,255,0.3)',   // Cachumbo - gris
  '#3b82f6',                 // Aprendiz - azul
  '#a855f7',                 // Creador  - morado
  '#f59e0b',                 // Experto  - ámbar
  '#ef4444',                 // Patrón   - rojo
  '#ffd700',                 // Leyenda  - dorado
];

// ─── ACCIONES QUE DAN XP ─────────────────────────────────────────────────────

export const XP_ACTIONS = {
  create:       { xp: 10,  dailyLimit: 2,   label: 'Crear Proyecto' },
  section:      { xp: 1,   dailyLimit: 10,  label: 'Añadir Sección' },
  collaborate:  { xp: 10,  dailyLimit: 2,   label: 'Invitar Colaborador' },
  project_live: { xp: 50,  dailyLimit: 3,   label: 'Proyectar en Vivo' },
  milestone:    { xp: 100, dailyLimit: 1,   label: 'Hito Proyector' },
  publish:      { xp: 30,  dailyLimit: 1,   label: 'Publicar en Galería' },
  cloned:       { xp: 5,   dailyLimit: 5,   label: 'Ser Clonado' },
};

// ─── COSTOS DE HP (Fallback) ─────────────────────────────────────────────────

export const DEFAULT_HP_COSTS = {
  brayan: 2,
  renegon: 2,
  catedratico: 5,
  cientifico: 5,
  motivador: 5,
  image_mini: 10,
  image_pro: 25,
};

// ─── FUNCIONES PURAS ─────────────────────────────────────────────────────────

/**
 * Calcula el nivel a partir del XP total.
 */
export function getLevelFromXP(xp, thresholds = DEFAULT_LEVEL_THRESHOLDS) {
  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/**
 * Retorna info del rango actual.
 */
export function getLevelInfo(level, rankNames = DEFAULT_RANK_NAMES) {
  const safeLevel = Math.min(level, rankNames.length - 1);
  return {
    level: safeLevel,
    name: rankNames[safeLevel] || 'Cachumbo',
    emoji: FALLBACK_EMOJIS[safeLevel] || '🌱',
    color: RANK_COLORS[safeLevel] || 'rgba(255,255,255,0.3)',
  };
}

/**
 * Calcula el porcentaje de progreso hacia el siguiente nivel.
 */
export function getProgressPercent(xp, thresholds = DEFAULT_LEVEL_THRESHOLDS) {
  const level = getLevelFromXP(xp, thresholds);
  const maxLevel = thresholds.length - 1;

  if (level >= maxLevel) return 100; // Nivel máximo alcanzado

  const currentThreshold = thresholds[level];
  const nextThreshold = thresholds[level + 1];
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Retorna el XP necesario para el siguiente nivel.
 */
export function getXpForNextLevel(xp, thresholds = DEFAULT_LEVEL_THRESHOLDS) {
  const level = getLevelFromXP(xp, thresholds);
  const maxLevel = thresholds.length - 1;
  if (level >= maxLevel) return thresholds[maxLevel];
  return thresholds[level + 1];
}

// ─── FUNCIONES ASYNC (INTERACTÚAN CON SUPABASE) ─────────────────────────────

/**
 * Lee la configuración global del sistema XP desde la BD.
 */
export async function fetchXpConfig(supabase) {
  try {
    const { data, error } = await supabase
      .from('xp_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.warn('xpService: No se pudo leer xp_config, usando defaults.', error?.message);
      return {
        enabled: true,
        xp_multiplier: 1.0,
        level_thresholds: DEFAULT_LEVEL_THRESHOLDS,
        rank_names: DEFAULT_RANK_NAMES,
        hp_costs: DEFAULT_HP_COSTS,
      };
    }

    return {
      enabled: data.enabled ?? true,
      xp_multiplier: parseFloat(data.xp_multiplier) || 1.0,
      level_thresholds: typeof data.level_thresholds === 'string'
        ? JSON.parse(data.level_thresholds)
        : data.level_thresholds || DEFAULT_LEVEL_THRESHOLDS,
      rank_names: typeof data.rank_names === 'string'
        ? JSON.parse(data.rank_names)
        : data.rank_names || DEFAULT_RANK_NAMES,
      hp_costs: typeof data.hp_costs === 'string'
        ? JSON.parse(data.hp_costs)
        : data.hp_costs || DEFAULT_HP_COSTS,
    };
  } catch (err) {
    console.error('xpService: Error fatal leyendo config:', err);
    return {
      enabled: true,
      xp_multiplier: 1.0,
      level_thresholds: DEFAULT_LEVEL_THRESHOLDS,
      rank_names: DEFAULT_RANK_NAMES,
      hp_costs: DEFAULT_HP_COSTS,
    };
  }
}

/**
 * Otorga XP a un usuario por una acción.
 * Respeta: sistema habilitado, límites diarios, multiplicador.
 */
export async function awardXP(supabase, userId, action) {
  const result = { awarded: false, xpGained: 0, newTotal: 0, newLevel: 0, leveledUp: false, reason: '' };

  try {
    // 1. Leer config global
    const config = await fetchXpConfig(supabase);
    if (!config.enabled) {
      result.reason = 'Sistema XP pausado por el administrador.';
      return result;
    }

    // 2. Validar acción
    const actionConfig = XP_ACTIONS[action];
    if (!actionConfig) {
      result.reason = `Acción desconocida: ${action}`;
      return result;
    }

    // 3. Leer perfil actual
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('xp, level, daily_xp_log')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      result.reason = 'No se pudo leer el perfil.';
      return result;
    }

    // 4. Verificar límite diario
    const today = new Date().toISOString().split('T')[0]; // "2026-04-21"
    let dailyLog = profile.daily_xp_log || {};

    // Resetear si es un día nuevo
    if (dailyLog.date !== today) {
      dailyLog = { date: today };
    }

    const currentCount = dailyLog[action] || 0;
    if (currentCount >= actionConfig.dailyLimit) {
      result.reason = `Límite diario alcanzado para "${actionConfig.label}" (${actionConfig.dailyLimit}/${actionConfig.dailyLimit}).`;
      return result;
    }

    // 5. Calcular XP con multiplicador
    const xpGained = Math.round(actionConfig.xp * config.xp_multiplier);
    const newTotal = (profile.xp || 0) + xpGained;
    const newLevel = getLevelFromXP(newTotal, config.level_thresholds);
    const leveledUp = newLevel > (profile.level || 0);

    // 6. Actualizar perfil
    dailyLog[action] = currentCount + 1;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        xp: newTotal,
        level: newLevel,
        daily_xp_log: dailyLog,
      })
      .eq('id', userId);

    if (updateErr) {
      result.reason = 'Error actualizando XP: ' + updateErr.message;
      return result;
    }

    result.awarded = true;
    result.xpGained = xpGained;
    result.newTotal = newTotal;
    result.newLevel = newLevel;
    result.leveledUp = leveledUp;
    return result;

  } catch (err) {
    result.reason = 'Error inesperado: ' + err.message;
    return result;
  }
}

/**
 * Descuenta HP de un usuario por uso de IA.
 * @param {string} personality — 'brayan', 'catedratico', 'image_mini', etc.
 */
export async function deductHP(supabase, userId, personality) {
  try {
    // 1. Leer config para obtener costos
    const config = await fetchXpConfig(supabase);
    const cost = config.hp_costs[personality];

    if (cost === undefined || cost === null) {
      return { success: true, remainingHP: null }; // Acción sin costo definido, dejar pasar
    }

    // 2. Leer HP actual
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('hp')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return { success: false, error: 'No se pudo verificar tu HP.' };
    }

    const currentHP = profile.hp ?? 0;

    if (currentHP < cost) {
      return {
        success: false,
        error: `HP insuficiente. Necesitas ${cost} HP pero solo tienes ${currentHP}. Contacta al admin para recargar.`,
      };
    }

    // 3. Descontar
    const newHP = currentHP - cost;
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ hp: newHP })
      .eq('id', userId);

    if (updateErr) {
      return { success: false, error: 'Error descontando HP: ' + updateErr.message };
    }

    return { success: true, remainingHP: newHP, cost };

  } catch (err) {
    return { success: false, error: 'Error inesperado: ' + err.message };
  }
}
