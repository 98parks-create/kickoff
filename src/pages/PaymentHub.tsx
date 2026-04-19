import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Trash2, Search, Calendar, User, TrendingUp, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

const PaymentHub: React.FC = () => {
  const { students, logs, confirmPayment, resetPayment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [depositorName, setDepositorName] = useState('');
  
  // Month Selection for Accounting
  const [selectedDate, setSelectedDate] = useState(new Date());
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  // Financial Logic for the Selected Month
  const accountingData = useMemo(() => {
    const monthLogs = logs.filter(log => {
      // Normalize date string for robust cross-browser parsing (WebKit/iOS fix)
      const normalizedDate = log.date.replace(/\. /g, '-').replace(/\.$/, '').replace(/\./g, '-');
      const logDate = new Date(normalizedDate);
      return logDate.getMonth() === month && logDate.getFullYear() === year;
    });

    return students.map(student => {
      const studentLogs = monthLogs.filter(l => l.studentId === student.id);
      const attendanceCount = studentLogs.filter(l => l.type === 'attendance').length;
      const paymentCheckCount = studentLogs.filter(l => l.type === 'payment').length;
      
      const monthlyRevenue = (student.pricePerLesson || 0) * paymentCheckCount;
      const monthlyUnpaid = Math.max(0, (student.pricePerLesson || 0) * attendanceCount - monthlyRevenue);

      return {
        ...student,
        monthlyRevenue,
        monthlyUnpaid,
        attendanceCount,
        paymentCheckCount
      };
    });
  }, [students, logs, month, year]);

  const totals = useMemo(() => {
    return accountingData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.monthlyRevenue,
      unpaid: acc.unpaid + curr.monthlyUnpaid
    }), { revenue: 0, unpaid: 0 });
  }, [accountingData]);

  const filteredStudents = accountingData.filter(s => {
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
    <div className="payment-hub" style={{ color: '#fff' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>회계 관리</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>레슨비 결제 현황 및 당월 매출 대시보드</p>
        </div>
        
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem 1.5rem', borderRadius: '1.25rem' }}>
            <button onClick={prevMonth} className="nav-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 800, minWidth: '110px', textAlign: 'center', fontSize: '1.1rem' }}>{monthName}</span>
            <button onClick={nextMonth} className="nav-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Revenue Dashboard */}
      <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '2rem', gap: '1.5rem' }}>
        <motion.div 
          className="premium-card" 
          style={{ 
            background: 'linear-gradient(135deg, #064e3b 0%, #1A1A1C 100%)',
            borderColor: 'var(--primary)',
            padding: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>당월 확정 매출</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            ₩{totals.revenue.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>선택한 달의 수업 결제 체크 합계</p>
        </motion.div>

        <motion.div 
          className="premium-card" 
          style={{ 
            background: 'linear-gradient(135deg, #450a0a 0%, #1A1A1C 100%)',
            borderColor: '#EF4444',
            padding: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>당월 총 미수금</span>
            <Clock size={20} color="#EF4444" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#EF4444' }}>
            ₩{totals.unpaid.toLocaleString()}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>출석 대비 결제가 부족한 레슨생 합계</p>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}/>
          <input 
            placeholder="선수 이름 또는 입금자명 검색..."
            className="glass"
            style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="glass" 
          style={{ 
            padding: '1rem 1.5rem', 
            borderRadius: '1.25rem', 
            border: '1px solid var(--glass-border)', 
            color: '#fff', 
            background: '#1a1a1c', /* Fix invisible text bug */
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600
          }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
        >
          <option value="All" style={{ background: '#1a1a1c' }}>입금 전체</option>
          <option value="Paid" style={{ background: '#1a1a1c' }}>입금완료 전용</option>
          <option value="Pending" style={{ background: '#1a1a1c' }}>입금대기 전용</option>
        </select>
      </div>

      {/* Payment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredStudents.map(student => (
          <motion.div 
            layout
            key={student.id} 
            className="premium-card"
            style={{ padding: '1.5rem', borderLeft: student.monthlyUnpaid > 0 ? '4px solid #EF4444' : '1px solid var(--glass-border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{student.name}</h3>
                  <span className={`badge ${student.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.75rem' }}>
                    {student.paymentStatus === 'Paid' ? '정기입금완료' : '입금대기'}
                  </span>
                  <span className="badge" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}>{student.lessonType === 'Private' ? '개인' : '그룹'}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={14}/> {student.team || '소속 없음'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14}/> {new Date(student.joinedDate).toLocaleDateString()} 등록</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 800 }}>당월 참여수</label>
                   <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{student.attendanceCount}회</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 800 }}>당월 수입</label>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>
                    ₩{student.monthlyRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {student.pricePerLesson?.toLocaleString()}원 × {student.paymentCheckCount}회
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 800 }}>당월 미수금</label>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: student.monthlyUnpaid > 0 ? '#EF4444' : 'var(--muted)' }}>
                    ₩{student.monthlyUnpaid.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {student.paymentStatus === 'Pending' ? (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                {editingPaymentId === student.id ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                      autoFocus
                      placeholder="입금자 성명 입력 (예: 부모님 성함)"
                      className="glass"
                      style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '0.75rem', fontSize: '0.9rem', color: '#fff' }}
                      value={depositorName}
                      onChange={e => setDepositorName(e.target.value)}
                    />
                    <button 
                      onClick={() => handleConfirm(student.id)}
                      className="btn-primary" 
                      style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                    >
                      확약하기
                    </button>
                    <button 
                      onClick={() => setEditingPaymentId(null)}
                      className="glass" 
                      style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem', border: 'none' }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setEditingPaymentId(student.id); setDepositorName(student.name); }}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 800 }}
                  >
                    입금 정보 확인 및 처리
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                borderTop: '1px solid var(--glass-border)', 
                paddingTop: '1.25rem', 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.9rem'
              }}>
                <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle size={16} color="var(--primary)" />
                  <span>입금자: <strong style={{ color: '#fff' }}>{student.depositorName}</strong></span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({new Date(student.paymentDate!).toLocaleDateString()} 입금)</span>
                </div>
                <button 
                  onClick={async () => await resetPayment(student.id)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Trash2 size={14} /> 기록 취소
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '2rem', border: '1px dashed var(--glass-border)' }}>
            <Wallet size={48} color="var(--muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>해당 조건의 결제 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHub;
