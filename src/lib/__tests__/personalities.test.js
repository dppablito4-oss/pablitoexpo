/**
 * personalities.test.js — Tests para la configuración de personalidades.
 *
 * Verifica integridad de los datos compartidos entre componentes de IA.
 */
import { describe, it, expect } from 'vitest';
import PERSONALITIES from '../../config/personalities';

describe('PERSONALITIES config', () => {
  const keys = Object.keys(PERSONALITIES);

  it('tiene al menos 5 personalidades', () => {
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it('cada personalidad tiene todos los campos requeridos', () => {
    for (const key of keys) {
      const p = PERSONALITIES[key];
      expect(p.id, `${key}.id`).toBe(key);
      expect(p.emoji, `${key}.emoji`).toBeTruthy();
      expect(p.name, `${key}.name`).toBeTruthy();
      expect(p.color, `${key}.color`).toContain('linear-gradient');
      expect(p.tooltip, `${key}.tooltip`).toBeTruthy();
      expect(p.tooltip.length, `${key}.tooltip length`).toBeGreaterThan(20);
    }
  });

  it('incluye las personalidades clave del plan', () => {
    expect(PERSONALITIES.brayan).toBeDefined();
    expect(PERSONALITIES.renegon).toBeDefined();
    expect(PERSONALITIES.catedratico).toBeDefined();
  });

  it('cada id coincide con su key en el objeto', () => {
    for (const [key, val] of Object.entries(PERSONALITIES)) {
      expect(val.id).toBe(key);
    }
  });

  it('no hay emojis vacíos', () => {
    for (const p of Object.values(PERSONALITIES)) {
      expect(p.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it('los colores son gradientes CSS válidos', () => {
    for (const p of Object.values(PERSONALITIES)) {
      expect(p.color).toMatch(/^linear-gradient\(/);
    }
  });
});
