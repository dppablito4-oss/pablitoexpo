/**
 * personalities.js — Fuente única de verdad para las personalidades de P.A.B.L.O.
 *
 * Importar desde aquí en vez de duplicar en cada componente de IA.
 */
export const PERSONALITIES = {
  brayan: {
    id: 'brayan',
    emoji: '🧢',
    name: 'El Brayan',
    color: 'linear-gradient(135deg, #a855f7, #6366f1)',
    tooltip: 'Habla como tu pata de la pichanga. Te ayuda con confianza, mucha jerga peruana y cero filtros.',
  },
  renegon: {
    id: 'renegon',
    emoji: '⚡',
    name: 'El Renegón',
    color: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    tooltip: 'Está estresado porque no ha dormido. Te va a trolear si tu diapo está tela. Úsalo si aguantas el sarcasmo.',
  },
  catedratico: {
    id: 'catedratico',
    emoji: '🎓',
    name: 'Catedrático',
    color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    tooltip: 'Tu asesor de tesis personal. Se enfoca en la ortografía y la jerarquía visual impecable.',
  },
  motivador: {
    id: 'motivador',
    emoji: '🚀',
    name: 'Motivador',
    color: 'linear-gradient(135deg, #f59e0b, #d97706)',
    tooltip: 'Tu fan número uno. Para él, todo lo que haces es arte. Te va a dar ánimos constantes.',
  },
  cientifico: {
    id: 'cientifico',
    emoji: '⚛️',
    name: 'Científico',
    color: 'linear-gradient(135deg, #10b981, #047857)',
    tooltip: 'Un genio incomprendido que explicará el diseño usando la mecánica cuántica y física.',
  },
  toxica: {
    id: 'toxica',
    emoji: '💅',
    name: 'La Tóxica (Yajhaira)',
    color: 'linear-gradient(135deg, #ec4899, #be185d)',
    tooltip: 'Personaje ficticio. Tu asistente celosa y dramática. Te ayudará, pero primero te hará una escena de celos por no escribirle.',
  },
  pituca: {
    id: 'pituca',
    emoji: '💁‍♀️',
    name: 'La Pituca (Valerie)',
    color: 'linear-gradient(135deg, #f472b6, #db2777)',
    tooltip: 'Personaje ficticio. Habla Spanglish, todo es aesthetic. Te ayudará si tu diseño no da cringe o es muy huachafo.',
  },
};

export default PERSONALITIES;
