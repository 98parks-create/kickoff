import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Trash2, Search, Calendar, User, TrendingUp } from 'lucide-react';

const PaymentHub: React.FC = () => {
  const { students, confirmPayment, resetPayment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState('');

  // Revenue Logic
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = students.reduce((acc, s) => {
    if (s.paymentStatus === 'Paid' && s.paymentDate) {
      const pDate = new Date(s.paymentDate);
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
        return acc + (s.pricePerLesson || 0) * s.totalSessions;
      }
    }
    return acc;
  }, 0);

  const pendingRevenue = students.reduce((acc, s) => {
    if (s.paymentStatus === 'Pending') {
      return acc + (s.pricePerLesson || 0) * s.totalSessions;
    }
    return acc;
  }, 0);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.depositorName && s.depositorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || s.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleConfirm = async (id: string) => {
    if (!depositorName) {
      alert('입금자 성명을 입력해주세요.');
      return;
    }
    await confirmPayment(id, depositorName);
    setEditingPaymentId(null);
    setDepositorName('');
  };

  return (
    <div className="payment-hub">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>회계 관리</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>결제 현황 및 매출 대시보드</p>
      </header>

      {/* Revenue Dashboard */}
      <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <motion.div 
          className="premium-card" 
          style={{ 
            background: 'linear-gradient(135deg, #064e3b 0%, #1A1A1C 100%)',
            borderColor: 'var(--primary)',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>이번 달 총 매출</span>
            <TrendingUp size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {monthlyRevenue.toLocaleString()}원
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>확정된 입금액 합계</p>
        </motion.div>

        <motion.div 
          className="premium-card" 
          style={{ 
            background: 'linear-gradient(135deg, #422006 0%, #1A1A1C 100%)',
            borderColor: 'var(--accent)',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>입금 대기 총액</span>
            <Clock size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {pendingRevenue.toLocaleString()}원
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>미결제 레슨생 합계</p>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}/>
          <input 
            placeholder="이름 또는 입금자명 검색..."
            className="glass"
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', color: '#fff' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="glass" 
          style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', color: '#fff' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
        >
          <option value="All">전체</option>
          <option value="Paid">입금완료</option>
          <option value="Pending">입금대기</option>
        </select>
      </div>

      {/* Payment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredStudents.map(student => (
          <motion.div 
            layout
            key={student.id} 
            className="premium-card"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>{student.name}</h3>
                  <span className={`badge ${student.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.7rem' }}>
                    {student.paymentStatus === 'Paid' ? '입금완료' : '입금대기'}
                  </span>
                  <span className="badge" style={{ fontSize: '0.7rem', opacity: 0.6 }}>{student.lessonType === 'Private' ? '개인' : '그룹'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={12}/> {new Date(student.joinedDate).toLocaleDateString()} 등록</span>
                  {student.paymentDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                      <CheckCircle size={12}/> {new Date(student.paymentDate).toLocaleDateString()} 입금
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {((student.pricePerLesson || 0) * student.totalSessions).toLocaleString()}원
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                  {student.pricePerLesson?.toLocaleString()}원 × {student.totalSessions}회
                </div>
              </div>
            </div>

            {student.paymentStatus === 'Pending' ? (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                {editingPaymentId === student.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      autoFocus
                      placeholder="입금자 성명 입력"
                      className="glass"
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#fff' }}
                      value={depositorName}
                      onChange={e => setDepositorName(e.target.value)}
                    />
                    <button 
                      onClick={() => handleConfirm(student.id)}
                      className="btn-primary" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      확인
                    </button>
                    <button 
                      onClick={() => setEditingPaymentId(null)}
                      className="glass" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setEditingPaymentId(student.id); setDepositorName(student.name); }}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                  >
                    입금완료 처리
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                borderTop: '1px solid var(--glass-border)', 
                paddingTop: '1rem', 
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={14} />
                  <span>입금자: <strong style={{ color: '#fff' }}>{student.depositorName}</strong></span>
                </div>
                <button 
                  onClick={async () => await resetPayment(student.id)}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', padding: '0.25rem' }}
                >
                  <Trash2 size={14} /> 취소
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHub;
