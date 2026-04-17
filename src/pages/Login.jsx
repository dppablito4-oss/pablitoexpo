import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const C = {
  bg:      '#06060d',
  glass:   'rgba(255,255,255,0.03)',
  border:  'rgba(255,255,255,0.08)',
  borderCyan: 'rgba(0,240,255,0.25)',
  cyan:    '#00f0ff',
  textMuted: 'rgba(255,255,255,0.45)',
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

  // Login fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Register-only fields
  const [username,         setUsername]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const switchMode = () => {
    setIsLogin(v => !v);
    setError('');
    setSuccess('');
    setUsername('');
    setConfirmPassword('');
    setPassword('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ── REGISTER VALIDATIONS ──────────────────────────────────────────
    if (!isLogin) {
      if (username.trim().length < 3) {
        setError('El apodo debe tener al menos 3 caracteres.');
        return;
      }
      if (/\s/.test(username)) {
        setError('El apodo no puede tener espacios. Usa guiones si quieres: mi-apodo');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden. Vuelve a revisar.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: authError } = await signIn({ email, password });
        if (authError) throw authError;
        navigate('/');
      } else {
        // Sign up
        const { error: authError } = await signUp({
          email,
          password,
          options: {
            data: { username: username.trim().toLowerCase() }
          }
        });
        if (authError) throw authError;

        // Auto-login right after (works when email confirmation is OFF in Supabase)
        const { error: loginError } = await signIn({ email, password });
        if (loginError) {
          // If email confirmation is still ON in Supabase, show this friendly message
          setSuccess('¡Cuenta creada! Inicia sesión con tus datos.');
          setIsLogin(true);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, fontFamily: "'Inter','Segoe UI',sans-serif",
      padding: '20px',
    }}>
      <motion.div
        key={isLogin ? 'login' : 'register'}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: '440px',
          background: C.glass,
          border: `1px solid ${C.border}`,
          borderRadius: '24px',
          padding: '40px 36px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #00f0ff, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '900', color: '#000',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(0,240,255,0.35)',
          }}>P</div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg, #00f0ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            {isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </h1>
          <p style={{ color: C.textMuted, fontSize: '0.875rem', marginTop: '8px' }}>
            {isLogin
              ? 'Ingresa al workspace de presentaciones'
              : 'Únete a Pablito Expo — es gratis'}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(255,60,60,0.08)', color: '#ff8888',
                border: '1px solid rgba(255,60,60,0.2)',
                padding: '12px 16px', borderRadius: '10px',
                fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5',
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(0,240,100,0.08)', color: '#6ee7b7',
                border: '1px solid rgba(0,240,100,0.2)',
                padding: '12px 16px', borderRadius: '10px',
                fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5',
              }}
            >
              ✅ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Username — solo en registro */}
          {!isLogin && (
            <Field label="Apodo único (username)">
              <input
                type="text"
                className="input-cyber"
                placeholder="ej: pablito_expo"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
              />
              <span style={{ fontSize: '10px', color: C.textMuted, marginTop: '4px', display: 'block' }}>
                Sin espacios · mínimo 3 caracteres · todo en minúsculas
              </span>
            </Field>
          )}

          <Field label="Correo electrónico">
            <input
              type="email"
              className="input-cyber"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña">
            <input
              type="password"
              className="input-cyber"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {!isLogin && (
              <span style={{ fontSize: '10px', color: C.textMuted, marginTop: '4px', display: 'block' }}>
                Mínimo 6 caracteres
              </span>
            )}
          </Field>

          {/* Confirm Password — solo en registro */}
          {!isLogin && (
            <Field label="Confirmar contraseña">
              <input
                type="password"
                className="input-cyber"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  borderColor: confirmPassword && confirmPassword !== password
                    ? 'rgba(255,80,80,0.5)'
                    : confirmPassword && confirmPassword === password
                    ? 'rgba(0,240,100,0.4)'
                    : undefined
                }}
              />
              {confirmPassword && confirmPassword === password && (
                <span style={{ fontSize: '10px', color: '#6ee7b7', marginTop: '4px', display: 'block' }}>
                  ✓ Las contraseñas coinciden
                </span>
              )}
            </Field>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px', padding: '14px',
              background: loading
                ? 'rgba(0,240,255,0.08)'
                : 'linear-gradient(135deg, rgba(0,240,255,0.85), rgba(124,58,237,0.85))',
              border: `1px solid ${C.borderCyan}`,
              borderRadius: '12px',
              color: loading ? C.textMuted : '#000',
              fontWeight: '800', fontSize: '0.95rem',
              letterSpacing: '0.04em', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,240,255,0.2)',
            }}
          >
            {loading
              ? 'Procesando...'
              : isLogin
              ? 'INGRESAR AL WORKSPACE'
              : 'CREAR MI CUENTA GRATIS'}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={switchMode}
            style={{
              color: C.textMuted, fontSize: '0.875rem',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.cyan}
            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
          >
            {isLogin
              ? '¿Primera vez? Crea tu cuenta gratis →'
              : '¿Ya tienes cuenta? Inicia sesión →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{
        display: 'block', marginBottom: '7px',
        fontSize: '12px', fontWeight: '600',
        color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
