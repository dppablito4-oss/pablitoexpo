/**
 * xpService.test.js — Tests unitarios para el motor de gamificación.
 *
 * Cubre las funciones puras (sin Supabase):
 * - getLevelFromXP
 * - getLevelInfo
 * - getProgressPercent
 * - getXpForNextLevel
 */
import { describe, it, expect } from 'vitest';
import {
  getLevelFromXP,
  getLevelInfo,
  getProgressPercent,
  getXpForNextLevel,
  DEFAULT_LEVEL_THRESHOLDS,
  DEFAULT_RANK_NAMES,
  FALLBACK_EMOJIS,
  RANK_COLORS,
  XP_ACTIONS,
  DEFAULT_HP_COSTS,
} from '../xpService';

// ─── getLevelFromXP ──────────────────────────────────────────────────────────
describe('getLevelFromXP', () => {
  // Thresholds: [0, 50, 150, 350, 600, 1000]
  it('devuelve nivel 0 para XP 0', () => {
    expect(getLevelFromXP(0)).toBe(0);
  });

  it('devuelve nivel 0 para XP 49', () => {
    expect(getLevelFromXP(49)).toBe(0);
  });

  it('devuelve nivel 1 para XP exacto de 50', () => {
    expect(getLevelFromXP(50)).toBe(1);
  });

  it('devuelve nivel 2 para XP 150', () => {
    expect(getLevelFromXP(150)).toBe(2);
  });

  it('devuelve nivel 3 para XP 350', () => {
    expect(getLevelFromXP(350)).toBe(3);
  });

  it('devuelve nivel 4 para XP 600', () => {
    expect(getLevelFromXP(600)).toBe(4);
  });

  it('devuelve nivel máximo (5) para XP 1000+', () => {
    expect(getLevelFromXP(1000)).toBe(5);
    expect(getLevelFromXP(9999)).toBe(5);
  });

  it('maneja thresholds personalizados', () => {
    const custom = [0, 100, 200];
    expect(getLevelFromXP(50, custom)).toBe(0);
    expect(getLevelFromXP(100, custom)).toBe(1);
    expect(getLevelFromXP(200, custom)).toBe(2);
    expect(getLevelFromXP(500, custom)).toBe(2);
  });

  it('maneja XP negativos (caso borde)', () => {
    expect(getLevelFromXP(-10)).toBe(0);
  });
});

// ─── getLevelInfo ─────────────────────────────────────────────────────────────
describe('getLevelInfo', () => {
  it('retorna info correcta para nivel 0 (Cachumbo)', () => {
    const info = getLevelInfo(0);
    expect(info.name).toBe('Cachumbo');
    expect(info.emoji).toBe('🌱');
    expect(info.level).toBe(0);
  });

  it('retorna info correcta para nivel 5 (Leyenda)', () => {
    const info = getLevelInfo(5);
    expect(info.name).toBe('Leyenda');
    expect(info.emoji).toBe('👑');
    expect(info.color).toBe('#ffd700');
  });

  it('clampea nivel que excede el array de rangos', () => {
    const info = getLevelInfo(99);
    expect(info.level).toBe(DEFAULT_RANK_NAMES.length - 1);
    expect(info.name).toBe('Leyenda');
  });

  it('acepta nombres de rango personalizados', () => {
    const custom = ['Noob', 'Pro'];
    const info = getLevelInfo(1, custom);
    expect(info.name).toBe('Pro');
  });
});

// ─── getProgressPercent ──────────────────────────────────────────────────────
describe('getProgressPercent', () => {
  it('retorna 0% al inicio del nivel', () => {
    expect(getProgressPercent(0)).toBe(0);
  });

  it('retorna 50% a la mitad entre nivel 0 y 1', () => {
    // Nivel 0 → 1: 0 a 50, mitad = 25
    expect(getProgressPercent(25)).toBe(50);
  });

  it('retorna 100% al nivel máximo', () => {
    expect(getProgressPercent(1000)).toBe(100);
    expect(getProgressPercent(5000)).toBe(100);
  });

  it('nunca retorna más de 100%', () => {
    expect(getProgressPercent(9999)).toBeLessThanOrEqual(100);
  });

  it('nunca retorna menos de 0%', () => {
    expect(getProgressPercent(0)).toBeGreaterThanOrEqual(0);
  });
});

// ─── getXpForNextLevel ──────────────────────────────────────────────────────
describe('getXpForNextLevel', () => {
  it('nivel 0 necesita 50 XP para subir', () => {
    expect(getXpForNextLevel(0)).toBe(50);
  });

  it('nivel 1 (XP 50) necesita 150 para subir', () => {
    expect(getXpForNextLevel(50)).toBe(150);
  });

  it('nivel máximo retorna el último threshold', () => {
    expect(getXpForNextLevel(1000)).toBe(1000);
    expect(getXpForNextLevel(5000)).toBe(1000);
  });
});

// ─── Constantes ─────────────────────────────────────────────────────────────
describe('Constantes de configuración', () => {
  it('DEFAULT_LEVEL_THRESHOLDS tiene 6 niveles', () => {
    expect(DEFAULT_LEVEL_THRESHOLDS).toHaveLength(6);
    expect(DEFAULT_LEVEL_THRESHOLDS[0]).toBe(0); // siempre empieza en 0
  });

  it('DEFAULT_RANK_NAMES tiene 6 nombres', () => {
    expect(DEFAULT_RANK_NAMES).toHaveLength(6);
  });

  it('FALLBACK_EMOJIS tiene 6 emojis', () => {
    expect(FALLBACK_EMOJIS).toHaveLength(6);
  });

  it('RANK_COLORS tiene 6 colores', () => {
    expect(RANK_COLORS).toHaveLength(6);
  });

  it('thresholds, nombres, emojis y colores tienen la misma longitud', () => {
    const len = DEFAULT_LEVEL_THRESHOLDS.length;
    expect(DEFAULT_RANK_NAMES).toHaveLength(len);
    expect(FALLBACK_EMOJIS).toHaveLength(len);
    expect(RANK_COLORS).toHaveLength(len);
  });

  it('XP_ACTIONS tiene al menos 5 acciones', () => {
    expect(Object.keys(XP_ACTIONS).length).toBeGreaterThanOrEqual(5);
  });

  it('cada acción tiene xp y dailyLimit', () => {
    for (const [key, action] of Object.entries(XP_ACTIONS)) {
      expect(action.xp, `${key}.xp`).toBeGreaterThan(0);
      expect(action.dailyLimit, `${key}.dailyLimit`).toBeGreaterThan(0);
      expect(action.label, `${key}.label`).toBeTruthy();
    }
  });

  it('DEFAULT_HP_COSTS tiene costos para las personalidades principales', () => {
    expect(DEFAULT_HP_COSTS.brayan).toBeDefined();
    expect(DEFAULT_HP_COSTS.catedratico).toBeDefined();
    expect(DEFAULT_HP_COSTS.renegon).toBeDefined();
  });

  it('thresholds están en orden ascendente', () => {
    for (let i = 1; i < DEFAULT_LEVEL_THRESHOLDS.length; i++) {
      expect(DEFAULT_LEVEL_THRESHOLDS[i]).toBeGreaterThan(DEFAULT_LEVEL_THRESHOLDS[i - 1]);
    }
  });
});
