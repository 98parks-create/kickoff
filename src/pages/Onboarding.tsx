import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ArrowRight, Activity, Users, User } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { addStudent } = useAppContext();
  const navigate = useNavigate();

  const [lessonType, setLessonType] = useState<'Private' | 'Group'>('Private');
  
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    dob: '',
    position: 'FW',
    goal: '취미' as '취미' | '엘리트',
    totalSessions: 10,
    team: '',
    pricePerLesson: 100000,
    preferredFoot: '오른발' as '왼발' | '오른발' | '양발',
    lessonLocation: '',
    ageCategory: 'U15',
    inflowRoute: '소개'
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    await addStudent({
      ...formData,
      lessonType,
      remainingSessions: formData.totalSessions,
      paymentStatus: 'Pending',
      eliteStatus: lessonType === 'Private' ? formData.goal : 'Group'
    });
    setTimeout(() => navigate('/'), 2000);
  };

  if (submitted) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}
        >
          <UserCheck color="#000" size={40} />
        </motion.div>
        <h2>등록 완료!</h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>코치님이 확인 후 연락드릴 예정입니다.</p>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--glass)', borderRadius: '1.5rem', marginBottom: '1rem' }}>
          <Activity color="var(--primary)" size={32} />
        </div>
        <h1 style={{ fontSize: '1.75rem' }}>레슨생 등록</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>레슨생의 정보를 입력하고 등록을 완료하세요.</p>
      </header>

      {/* Top Selector */}
      <div className="glass" style={{ 
        display: 'flex', 
        padding: '0.25rem', 
        borderRadius: '1rem', 
        marginBottom: '2rem' 
      }}>
        {(['Private', 'Group'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setLessonType(type)}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: lessonType === type ? 'var(--primary)' : 'transparent',
              color: lessonType === type ? '#000' : 'var(--muted)',
              borderRadius: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {type === 'Private' ? <User size={18} /> : <Users size={18} />}
            {type === 'Private' ? '개인 레슨' : '그룹 레슨'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Shared Header Fields: Name/Team Name */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>
              {lessonType === 'Private' ? '성함' : '그룹/팀명'}
            </label>
            <input 
              required
              className="glass"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder={lessonType === 'Private' ? '홍길동' : '위너스 FC'}
            />
          </div>

          {/* Conditional Fields for Private */}
          <AnimatePresence mode="wait">
            {lessonType === 'Private' ? (
              <motion.div 
                key="private-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div className="onboarding-grid">
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>연락처</label>
                    <input 
                      required
                      className="glass"
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>생년월일</label>
                    <input 
                      required
                      type="date"
                      className="glass"
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
                </div>

                <div className="onboarding-grid">
                  <div className="glass">
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>연령별 카테고리</label>
                    <select 
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                      value={formData.ageCategory}
                      onChange={e => setFormData({...formData, ageCategory: e.target.value})}
                    >
                      <option value="U12">U12</option>
                      <option value="U15">U15</option>
                      <option value="U18">U18</option>
                      <option value="성인">성인</option>
                    </select>
                  </div>
                  <div className="glass">
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>유입 경로</label>
                    <select 
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                      value={formData.inflowRoute}
                      onChange={e => setFormData({...formData, inflowRoute: e.target.value})}
                    >
                      <option value="소개">소개</option>
                      <option value="팀 레슨">팀 레슨</option>
                      <option value="SNS">SNS</option>
                      <option value="포털">포털</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div className="onboarding-grid">
                  <div className="glass">
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>포지션</label>
                    <select 
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                      value={formData.position}
                      onChange={e => setFormData({...formData, position: e.target.value})}
                    >
                      <option value="FW">FW</option>
                      <option value="MF">MF</option>
                      <option value="DF">DF</option>
                      <option value="GK">GK</option>
                    </select>
                  </div>
                  <div className="glass">
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>주발</label>
                    <select 
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                      value={formData.preferredFoot}
                      onChange={e => setFormData({...formData, preferredFoot: e.target.value as any})}
                    >
                      <option value="오른발">오른발</option>
                      <option value="왼발">왼발</option>
                      <option value="양발">양발</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>소속팀 (선택)</label>
                  <input 
                    className="glass"
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                    value={formData.team}
                    onChange={e => setFormData({...formData, team: e.target.value})}
                    placeholder="학교 또는 클럽명"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="group-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>대표 연락처</label>
                  <input 
                    required
                    className="glass"
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                    placeholder="010-0000-0000"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shared Footer Fields: Price, Sessions, Location */}
          <div className="onboarding-grid">
            <div className="glass">
              <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>레슨 유형</label>
              <select 
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', color: '#fff' }}
                value={formData.goal}
                onChange={e => setFormData({...formData, goal: e.target.value as any})}
              >
                <option value="취미">취미</option>
                <option value="엘리트">엘리트</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>결제 횟수 (총)</label>
              <input 
                required
                type="number"
                className="glass"
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
                value={formData.totalSessions}
                onChange={e => setFormData({...formData, totalSessions: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>1회당 레슨 비용 (원)</label>
            <input 
              required
              type="number"
              className="glass"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
              value={formData.pricePerLesson || ''}
              onChange={e => setFormData({...formData, pricePerLesson: Number(e.target.value)})}
              placeholder="단가를 입력하세요"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>주 레슨 장소</label>
            <input 
              required
              className="glass"
              style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff' }}
              value={formData.lessonLocation}
              onChange={e => setFormData({...formData, lessonLocation: e.target.value})}
              placeholder="OO 축구장"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.25rem', marginTop: '1rem' }}>
          등록 완료하기
          <ArrowRight size={20} />
        </button>
      </form>
      <style>{`
        .onboarding-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .onboarding-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .premium-card {
            padding: 1rem;
          }
          .onboarding {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
