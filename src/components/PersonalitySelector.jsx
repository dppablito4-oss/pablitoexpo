/**
 * PersonalitySelector.jsx — Barra de selección de personalidades reutilizable.
 *
 * Usado en GlobalAiCopilot y AiCopilotPanel.
 */
import PERSONALITIES from '../config/personalities';

export default function PersonalitySelector({ current, onChange }) {
  return (
    <div className="px-4 py-2 border-b border-neutral-800 bg-black flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
      {Object.values(PERSONALITIES).map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          title={p.tooltip}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap
            ${current === p.id
              ? 'bg-neutral-800 text-white border border-neutral-600'
              : 'bg-transparent text-neutral-500 hover:bg-neutral-900 border border-transparent'}`}
        >
          <span>{p.emoji}</span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
}
