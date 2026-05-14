/**
 * theme.js — Paleta de colores compartida de Pablito Expo.
 *
 * Fuente única de verdad para todos los colores del sistema.
 * Antes se repetía `const C = { ... }` en 6 archivos distintos.
 */
export const theme = {
  bg:         '#06060d',
  sidebar:    'rgba(10,10,20,0.97)',
  glass:      'rgba(255,255,255,0.028)',
  border:     'rgba(255,255,255,0.07)',
  borderCyan: 'rgba(0,240,255,0.18)',
  cyan:       '#00f0ff',
  purple:     '#7c3aed',
  purpleLight:'#a78bfa',
  textPrimary:'#e2e8f0',
  textMuted:  'rgba(255,255,255,0.35)',
  textHover:  'rgba(255,255,255,0.45)',
  dangerBg:   'rgba(255,50,50,0.04)',
  dangerBorder:'rgba(255,80,80,0.15)',
  dangerText: '#ff6b6b',
  successText:'#6ee7b7',
};

// Alias por retrocompatibilidad — los archivos existentes usan `C`
export const C = theme;

export default theme;
