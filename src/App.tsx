import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PaymentHub from './pages/PaymentHub';
import Management from './pages/Management';
import Login from './pages/Login';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, LayoutList, AlertTriangle } from 'lucide-react';
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
      <NavLink to="/management" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutList size={24} />
      </NavLink>
    </nav>
  );
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAppContext();
  const isConfigMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', gap: '1.5rem' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <LayoutDashboard size={40} color="var(--primary)" />
        </motion.div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isConfigMissing) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '1.5rem', marginBottom: '1.5rem' }}>
          <AlertTriangle size={48} color="#EF4444" />
        </div>
        <h2 style={{ marginBottom: '1rem' }}>설정 오류</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          서버 환경 변수(Environment Variables)가 설정되지 않았습니다.<br/>
          Vercel 대시보드에서 <b>VITE_SUPABASE_URL</b>과 <b>VITE_SUPABASE_ANON_KEY</b>를 추가해 주세요.
        </p>
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
      <Route path="/management" element={<AuthWrapper><Management /></AuthWrapper>} />
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
