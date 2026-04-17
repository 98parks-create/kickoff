import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Activity, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('가입 확인 이메일이 발송되었습니다. 이메일을 확인해주세요!');
      }
    } catch (err: any) {
      let message = '인증에 실패했습니다.';
      if (err.message === 'Invalid login credentials') {
        message = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (err.message === 'Email not confirmed') {
        message = '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.';
      } else {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card" 
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--glass)', borderRadius: '1.5rem', marginBottom: '1.5rem' }}>
            <Activity color="var(--primary)" size={40} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kick-Off</h1>
          <p style={{ color: 'var(--muted)' }}>코치님을 위한 운영 부하 제로 관리 앱</p>
        </div>

        <div className="glass" style={{ display: 'flex', padding: '0.25rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          {(['Login', 'Signup'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setIsLogin(mode === 'Login'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: (isLogin && mode === 'Login') || (!isLogin && mode === 'Signup') ? 'var(--primary)' : 'transparent',
                color: (isLogin && mode === 'Login') || (!isLogin && mode === 'Signup') ? '#000' : 'var(--muted)',
                borderRadius: '0.5rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {mode === 'Login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>이메일</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                required
                type="email"
                className="glass"
                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coach@example.com"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                required
                type="password"
                className="glass"
                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ color: '#EF4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '가입하기')}
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          개인정보는 암호화되어 안전하게 보호됩니다.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
