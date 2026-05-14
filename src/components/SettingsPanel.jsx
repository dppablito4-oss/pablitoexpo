import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import PERSONALITIES from '../config/personalities';
import { C } from '../config/theme';


// ─── Helper: Setting Card ────────────────────────────────────────────────────
function SettingCard({ title, description, children }) {
  return (
    <div style={{
      background: C.glass, border: `1px solid ${C.border}`,
      borderRadius: '16px', padding: '24px',
      backdropFilter: 'blur(12px)',
    }}>
      <h3 style={{ color: C.textPrimary, fontWeight: '700', fontSize: '1rem', margin: '0 0 4px' }}>{title}</h3>
      {description && <p style={{ color: C.textMuted, fontSize: '0.8rem', margin: '0 0 16px', lineHeight: 1.5 }}>{description}</p>}
      {children}
    </div>
  );
}

// ─── Helper: Input row ───────────────────────────────────────────────────────
function SettingRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: '600', color: C.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.4)',
  border: `1px solid ${C.border}`,
  borderRadius: '10px', color: C.textPrimary,
  fontSize: '0.875rem', outline: 'none',
  transition: 'border-color 0.2s',
};

export default function SettingsPanel() {
  const { user, signOut } = useAuth();
  
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [email, setEmail] = useState('');
  const [aiPersonality, setAiPersonality] = useState('brayan');
  const [aiVerified, setAiVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [stats, setStats] = useState({ totalProjects: 0, totalSections: 0 });

  // Load profile data
  useEffect(() => {
    if (!user?.id) return;
    setEmail(user.email || '');
    
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles')
        .select('username, ai_personality, ai_verified, created_at')
        .eq('id', user.id).single();
      
      if (data) {
        setUsername(data.username || '');
        setOriginalUsername(data.username || '');
        setAiPersonality(data.ai_personality || 'brayan');
        setAiVerified(!!data.ai_verified);
        setCreatedAt(data.created_at || '');
      }
    };
    
    // Load stats
    const loadStats = async () => {
      const { data, count } = await supabase.from('presentations')
        .select('slides_data', { count: 'exact' })
        .eq('user_id', user.id)
        .is('deleted_at', null);
      
      let totalSections = 0;
      (data || []).forEach(p => {
        totalSections += (p.slides_data?.sections?.length || 0);
      });
      
      setStats({ totalProjects: count || 0, totalSections });
    };
    
    loadProfile();
    loadStats();
  }, [user?.id, user?.email]);

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    if (username === originalUsername) return;
    
    setSaving(true);
    setSaveMsg('');
    
    // Check uniqueness
    const { data: existing } = await supabase.from('profiles')
      .select('id').eq('username', username.trim()).neq('id', user.id).limit(1);
    
    if (existing && existing.length > 0) {
      setSaveMsg('❌ Ese nombre de usuario ya está en uso.');
      setSaving(false);
      return;
    }
    
    const { error } = await supabase.from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);
    
    if (error) {
      setSaveMsg('❌ Error: ' + error.message);
    } else {
      setOriginalUsername(username.trim());
      setSaveMsg('✅ Nombre actualizado.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handlePersonalityUpdate = async (newP) => {
    setAiPersonality(newP);
    await supabase.from('profiles').update({ ai_personality: newP }).eq('id', user.id);
  };

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>

      {/* ── Profile Card ── */}
      <SettingCard title="👤 Perfil" description="Tu identidad dentro de Pablito Expo.">
        <SettingRow label="Nombre de usuario">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="tu_usuario"
              maxLength={24}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.cyan}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button
              onClick={handleSaveUsername}
              disabled={saving || username === originalUsername || !username.trim()}
              style={{
                padding: '10px 20px',
                background: username !== originalUsername ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${username !== originalUsername ? C.borderCyan : C.border}`,
                borderRadius: '10px',
                color: username !== originalUsername ? C.cyan : C.textMuted,
                fontSize: '0.8rem', fontWeight: '700',
                cursor: saving || username === originalUsername ? 'not-allowed' : 'pointer',
                opacity: saving || username === originalUsername ? 0.4 : 1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
          {saveMsg && <p style={{ fontSize: '0.75rem', color: saveMsg.startsWith('✅') ? '#22d3ee' : '#ff6b6b', margin: '6px 0 0' }}>{saveMsg}</p>}
          <p style={{ fontSize: '0.7rem', color: C.textMuted, margin: '4px 0 0' }}>Solo letras minúsculas, números y guiones bajos. Máximo 24 caracteres.</p>
        </SettingRow>

        <SettingRow label="Correo electrónico">
          <input type="text" value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
          <p style={{ fontSize: '0.7rem', color: C.textMuted, margin: '4px 0 0' }}>El correo no se puede cambiar. Es tu identificador único de Supabase Auth.</p>
        </SettingRow>
      </SettingCard>

      {/* ── AI Personality ── */}
      <SettingCard title="🤖 Personalidad de P.A.B.L.O." description="Elige la personalidad predeterminada para tu asistente IA.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.values(PERSONALITIES).map(p => (
            <button
              key={p.id}
              onClick={() => handlePersonalityUpdate(p.id)}
              title={p.tooltip}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '12px',
                background: aiPersonality === p.id ? p.color : 'rgba(255,255,255,0.04)',
                border: `1px solid ${aiPersonality === p.id ? 'rgba(255,255,255,0.2)' : C.border}`,
                color: aiPersonality === p.id ? '#fff' : C.textMuted,
                fontSize: '0.8rem', fontWeight: aiPersonality === p.id ? '700' : '500',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: aiPersonality === p.id ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        {aiPersonality && (
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
            {PERSONALITIES[aiPersonality]?.tooltip}
          </p>
        )}
      </SettingCard>

      {/* ── Account Info ── */}
      <SettingCard title="📊 Tu Cuenta" description="Estadísticas y datos de tu cuenta.">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px', marginBottom: '16px',
        }}>
          {[
            { label: 'Proyectos', value: stats.totalProjects, icon: '🗄️' },
            { label: 'Secciones', value: stats.totalSections, icon: '📐' },
            { label: 'IA Verificada', value: aiVerified ? 'Sí ✅' : 'No 🔒', icon: '🤖' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${C.border}`,
              borderRadius: '12px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: C.textPrimary }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: C.textMuted }}>
          📅 Miembro desde: <span style={{ color: C.textPrimary, fontWeight: '600' }}>{memberSince}</span>
        </p>
      </SettingCard>

      {/* ── Danger Zone ── */}
      <div style={{
        background: 'rgba(255,50,50,0.04)', border: '1px solid rgba(255,80,80,0.15)',
        borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ color: '#ff6b6b', fontWeight: '700', fontSize: '1rem', margin: '0 0 4px' }}>⚠️ Zona de Peligro</h3>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: '0 0 16px', lineHeight: 1.5 }}>
          Acciones irreversibles sobre tu cuenta.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de cerrar sesión?')) signOut();
            }}
            style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.border}`, borderRadius: '10px',
              color: C.textMuted, fontSize: '0.8rem', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
