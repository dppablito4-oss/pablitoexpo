import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>Dashboard</h1>
        <button className="btn-cyber" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={signOut}>
          Sign Out ({user?.email})
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel" 
        style={{ padding: '40px', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: '16px' }}>Your Presentations</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You don't have any presentations yet.
        </p>
        <button className="btn-cyber" style={{ width: 'auto' }}>
          + Create New Presentation
        </button>
      </motion.div>
    </div>
  );
}
