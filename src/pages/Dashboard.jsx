import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generateSlug } from '../lib/slugify';

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:       '#06060d',
  sidebar:  'rgba(10,10,20,0.97)',
  glass:    'rgba(255,255,255,0.028)',
  border:   'rgba(255,255,255,0.07)',
  borderCyan:'rgba(0,240,255,0.18)',
  cyan:     '#00f0ff',
  purple:   '#7c3aed',
  textPrimary: '#e2e8f0',
  textMuted:   'rgba(255,255,255,0.35)',
};

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'vault',    icon: '🗄️',  label: 'Mis Bóvedas' },
  { id: 'trash',    icon: '🗑️',  label: 'Papelera'    },
  { id: 'settings', icon: '⚙️',  label: 'Ajustes'     },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [presentations, setPresentations]       = useState([]);
  const [trashedPresentations, setTrashedPresentations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeNav, setActiveNav] = useState('vault');
  const navigate = useNavigate();

  useEffect(() => { fetchPresentations(); }, [user]);

  // ── DATA FETCHING (ORIGINAL, SIN TOCAR) ────────────────────────────────────
  const fetchPresentations = async () => {
    try {
      const { data, error } = await supabase
        .from('presentations').select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPresentations(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTrashed = async () => {
    const { data } = await supabase
      .from('presentations').select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    setTrashedPresentations(data || []);
  };

  const createPresentation = async () => {
    const newTitle = prompt('Nombre del nuevo proyecto:', 'Nuevo Proyecto');
    if (!newTitle) return;
    const { data, error } = await supabase.from('presentations').insert([{
      title: newTitle, slug: generateSlug(newTitle), user_id: user.id,
      slides_data: { slides: [{ id: crypto.randomUUID(), type: 'title', content: 'Diapositiva Inicial' }] },
      editors_emails: [user.email]
    }]).select();
    if (!error && data) fetchPresentations();
    else if (error) alert('Error al crear: ' + error.message);
  };

  const deletePresentation = async (id, title) => {
    if (!window.confirm(`¿Mover "${title}" a la papelera?`)) return;
    const { error } = await supabase.from('presentations')
      .update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) alert(`Error: ${error.message}`);
    else fetchPresentations();
  };

  const restorePresentation = async (id) => {
    const { error } = await supabase.from('presentations').update({ deleted_at: null }).eq('id', id);
    if (!error) { fetchPresentations(); fetchTrashed(); }
  };

  const permanentDelete = async (id, title) => {
    if (!window.confirm(`¿Eliminar "${title}" para siempre? Esto NO se puede deshacer.`)) return;
    const { error } = await supabase.from('presentations').delete().eq('id', id);
    if (!error) fetchTrashed();
  };

  const addVipEditor = async (id, currentEditors) => {
    const email = prompt('Correo del colaborador VIP:');
    if (!email) return;
    if (currentEditors?.includes(email)) { alert('¡Ya tiene acceso!'); return; }
    const newEditors = [...(currentEditors || []), email];
    const { error } = await supabase.from('presentations').update({ editors_emails: newEditors }).eq('id', id);
    if (!error) { alert(`${email} ahora tiene acceso VIP.`); fetchPresentations(); }
    else alert('Solo el Administrador puede invitar.');
  };

  const daysLeft = (deletedAt) =>
    Math.max(0, 7 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000));

  const handleNavClick = (id) => {
    setActiveNav(id);
    if (id === 'trash') fetchTrashed();
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        backdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f0ff, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: '900', color: '#000',
              boxShadow: '0 0 16px rgba(0,240,255,0.35)',
            }}>P</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.08em',
                background: 'linear-gradient(90deg, #00f0ff, #7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PABLITO EXPO
              </div>
              <div style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.12em' }}>NETWORK v2</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: '9px', color: C.textMuted, letterSpacing: '0.15em', marginBottom: '10px', paddingLeft: '8px' }}>
            NAVEGACIÓN
          </div>
          {NAV.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={activeNav === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}

          {/* Divider + Fundar */}
          <div style={{ margin: '20px 0 14px', borderTop: `1px solid ${C.border}` }} />
          <button
            onClick={createPresentation}
            style={{
              width: '100%', padding: '11px 14px',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(124,58,237,0.15))',
              border: `1px solid ${C.borderCyan}`,
              borderRadius: '12px', color: C.cyan,
              fontSize: '12px', fontWeight: '700', letterSpacing: '0.06em',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.2)'; e.currentTarget.style.borderColor = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.borderCyan; }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
            FUNDAR PROYECTO
          </button>
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f0ff33, #7c3aed33)',
              border: '1px solid rgba(0,240,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: C.cyan, fontWeight: '700', flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
              <div style={{ fontSize: '9px', color: C.textMuted }}>Operador Registrado</div>
            </div>
          </div>
          <button
            onClick={signOut}
            style={{
              width: '100%', padding: '8px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            Desconectar
          </button>
          {/* Micro credits */}
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', marginTop: '12px', lineHeight: 1.5 }}>
            POWERED BY <span style={{ color: 'rgba(0,240,255,0.35)' }}>P.A.B.L.O.</span><br />
            © 2025–2026 pablitodp
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 36px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.03em', color: C.textPrimary, margin: 0 }}>
            {activeNav === 'vault'    && 'Bóveda de Proyectos'}
            {activeNav === 'trash'    && '🗑️ Papelera'}
            {activeNav === 'settings' && '⚙️ Ajustes'}
          </h1>
          <p style={{ color: C.textMuted, fontSize: '0.875rem', marginTop: '6px' }}>
            {activeNav === 'vault'    && `${presentations.length} proyecto${presentations.length !== 1 ? 's' : ''} activo${presentations.length !== 1 ? 's' : ''}`}
            {activeNav === 'trash'    && 'Proyectos eliminados — se borran permanentemente en 7 días.'}
            {activeNav === 'settings' && 'Configuración de la cuenta.'}
          </p>
        </div>

        {/* ── VAULT VIEW ── */}
        {activeNav === 'vault' && (
          <>
            {loading ? (
              <EmptyState icon="⏳" message="Sincronizando nodos de la bóveda..." />
            ) : presentations.length === 0 ? (
              <EmptyState icon="🌌" message="La bóveda está vacía. ¡Funda tu primer proyecto!" />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
              }}>
                {presentations.map((pres, i) => (
                  <ProjectCard
                    key={pres.id} pres={pres} index={i} user={user}
                    onProject={() => navigate(`/projector/${pres.slug || pres.id}`)}
                    onLaser={()   => navigate(`/remote/${pres.slug || pres.id}`)}
                    onEdit={()    => navigate(`/editor/${pres.slug || pres.id}`)}
                    onVip={()     => addVipEditor(pres.id, pres.editors_emails)}
                    onDelete={()  => deletePresentation(pres.id, pres.title)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TRASH VIEW ── */}
        {activeNav === 'trash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trashedPresentations.length === 0 ? (
              <EmptyState icon="✨" message="La papelera está limpia." />
            ) : trashedPresentations.map(pres => (
              <motion.div
                key={pres.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: C.glass, border: `1px solid ${C.border}`,
                  borderRadius: '14px', padding: '16px 20px',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div>
                  <p style={{ color: C.textPrimary, fontWeight: '600', margin: 0 }}>{pres.title}</p>
                  <p style={{ color: '#ff8888', fontSize: '0.75rem', margin: '4px 0 0' }}>
                    ⏳ {daysLeft(pres.deleted_at)} día{daysLeft(pres.deleted_at) !== 1 ? 's' : ''} restantes
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <PillBtn color="cyan"   onClick={() => restorePresentation(pres.id)}>↩️ Restaurar</PillBtn>
                  <PillBtn color="red"    onClick={() => permanentDelete(pres.id, pres.title)}>🔥 Borrar ya</PillBtn>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── SETTINGS VIEW ── */}
        {activeNav === 'settings' && (
          <div style={{ background: C.glass, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px' }}>
            <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>
              Esta sección está en construcción. Próximamente: cambio de nombre de usuario, tema visual y exportación de proyectos.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 12px', marginBottom: '4px',
        background: active ? 'rgba(0,240,255,0.08)' : 'transparent',
        border: active ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent',
        borderRadius: '10px',
        color: active ? '#00f0ff' : 'rgba(255,255,255,0.45)',
        fontSize: '12px', fontWeight: active ? '600' : '500',
        letterSpacing: '0.04em',
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '10px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '14px' }}>{item.icon}</span>
      {item.label}
    </button>
  );
}

function ProjectCard({ pres, index, user, onProject, onLaser, onEdit, onVip, onDelete }) {
  const isOwner  = pres.user_id === user.id;
  const isEditor = pres.editors_emails?.includes(user.email);
  const canEdit  = isOwner || isEditor;
  const slideCount = pres.slides_data?.sections?.length ?? pres.slides_data?.slides?.length ?? 0;
  const updatedDate = pres.updated_at
    ? new Date(pres.updated_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    : '—';

  // Gradient preview based on index
  const gradients = [
    'linear-gradient(135deg, #0a1628, #0d2a4a, #0a3366)',
    'linear-gradient(135deg, #1a0a28, #2d0a4a, #4a0a66)',
    'linear-gradient(135deg, #0a2010, #0d3a1a, #0a5530)',
    'linear-gradient(135deg, #28100a, #4a1a0d, #661a0a)',
  ];
  const previewGrad = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: isOwner ? '1px solid rgba(0,240,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px', overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        boxShadow: isOwner ? '0 4px 32px rgba(0,240,255,0.06)' : '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      whileHover={{ y: -3, boxShadow: '0 8px 40px rgba(0,240,255,0.1)' }}
    >
      {/* Preview Area */}
      <div style={{
        height: '90px',
        background: previewGrad,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '28px', opacity: 0.4 }}>📽️</span>
        {/* Role Badge */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: '700',
          background: isOwner ? 'rgba(0,240,255,0.2)' : 'rgba(124,58,237,0.3)',
          color: isOwner ? '#00f0ff' : '#c4b5fd',
          border: isOwner ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(124,58,237,0.4)',
          backdropFilter: 'blur(8px)',
        }}>
          {isOwner ? '👑 ADMIN' : isEditor ? '🛠️ VIP' : '👁️ LECTOR'}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#e2e8f0', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {pres.title}
        </h3>

        {/* Meta badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <MetaBadge icon="🗂️" label={`${slideCount} sección${slideCount !== 1 ? 'es' : ''}`} />
          <MetaBadge icon="📅" label={updatedDate} />
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionBtn flex={1} onClick={onProject} style={{ background: 'rgba(0,240,255,0.06)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)' }}>
              📺 Proyectar
            </ActionBtn>
            <ActionBtn flex={1} onClick={onLaser} style={{ background: 'rgba(124,58,237,0.08)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
              📱 Láser
            </ActionBtn>
          </div>

          {canEdit && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <ActionBtn flex={3} onClick={onEdit} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ✏️ Editor
              </ActionBtn>
              {isOwner && (
                <>
                  <ActionBtn flex={1} onClick={onVip} style={{ background: 'rgba(0,240,255,0.05)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.15)' }} title="Invitar colaborador">
                    👤+
                  </ActionBtn>
                  <ActionBtn flex={1} onClick={onDelete} style={{ background: 'rgba(255,150,0,0.05)', color: 'rgba(255,180,60,0.6)', border: '1px solid rgba(255,150,0,0.15)' }} title="Mover a papelera">
                    🗑️
                  </ActionBtn>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetaBadge({ icon, label }) {
  return (
    <span style={{
      fontSize: '10px', color: 'rgba(255,255,255,0.35)',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '6px', padding: '3px 8px',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      {icon} {label}
    </span>
  );
}

function ActionBtn({ children, onClick, style, flex = 1, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex, padding: '8px 10px', fontSize: '11px', fontWeight: '600',
        borderRadius: '10px', cursor: 'pointer',
        transition: 'all 0.15s', letterSpacing: '0.02em',
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

function PillBtn({ children, onClick, color }) {
  const colors = {
    cyan: { bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.25)', text: '#00f0ff' },
    red:  { bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.25)',  text: '#ff8888' },
  };
  const c = colors[color];
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px', fontSize: '11px', fontWeight: '600',
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 40px',
      color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{icon}</div>
      {message}
    </div>
  );
}
