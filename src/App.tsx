import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PaymentHub from './pages/PaymentHub';
import Login from './pages/Login';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const Navbar = () => {
  return (
    <nav className="glass" style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '1rem',
      right: '1rem',
      height: '4.5rem',
      borderRadius: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
      padding: '0 1rem'
    }}>
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={24} />
      </NavLink>
      <NavLink to="/onboarding" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Users size={24} />
      </NavLink>
      <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <CreditCard size={24} />
      </NavLink>
    </nav>
  );
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAppContext();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <LayoutDashboard size={40} color="var(--primary)" />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <button 
        onClick={() => supabase.auth.signOut()}
        className="glass"
        style={{ 
          position: 'fixed', 
          top: '1rem', 
          right: '1rem', 
          zIndex: 1100, 
          padding: '0.6rem', 
          borderRadius: '0.75rem', 
          border: '1px solid var(--glass-border)', 
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
      >
        <LogOut size={16} />
        로그아웃
      </button>
      <main className="container" style={{ paddingBottom: '7rem', paddingTop: '4rem' }}>
        {children}
      </main>
      <Navbar />
    </>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginWrapper />} />
      <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
      <Route path="/onboarding" element={<AuthWrapper><Onboarding /></AuthWrapper>} />
      <Route path="/payments" element={<AuthWrapper><PaymentHub /></AuthWrapper>} />
    </Routes>
  );
}

const LoginWrapper = () => {
  const { session, loading } = useAppContext();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Login />;
};

export default App;
