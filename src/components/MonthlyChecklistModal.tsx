import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  CheckCircle2, 
  Circle,
  Search,
  User
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewType: 'Private' | 'Group';
}

const MonthlyChecklistModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  setSelectedDate,
  viewType 
}) => {
  const { students, logs, recordGridCheck } = useAppContext();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Date helpers
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.lessonType === viewType)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, viewType, searchTerm]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ zIndex: 3000 }}
      >
        <motion.div 
          className="modal-content"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ 
            height: '95vh', 
            padding: 0, 
            display: 'flex', 
            flexDirection: 'column',
            maxWidth: '100%',
            background: '#121214'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {selectedStudentId && (
                <button 
                   onClick={() => setSelectedStudentId(null)}
                   className="glass"
                   style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', color: 'var(--primary)' }}
                >
                    <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedStudentId ? `${selectedStudent?.name} 선수 관리` : '출석 및 결제 체크'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {selectedStudentId ? `${monthName}` : `${viewType === 'Private' ? '개인' : '그룹'} 레슨 리스트`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="glass"
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {!selectedStudentId ? (
            /* Phase 1: Player Selection List */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem' }}>
                 <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '1rem' }}>
                    <Search size={18} color="var(--muted)" style={{ marginRight: '0.5rem' }} />
                    <input 
                       placeholder="선수 이름 검색..." 
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       style={{ background: 'none', border: 'none', color: '#fff', flex: 1, outline: 'none' }}
                    />
                 </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
                 {filteredStudents.map(student => (
                    <button 
                       key={student.id}
                       onClick={() => setSelectedStudentId(student.id)}
                       className="premium-card"
                       style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '1.25rem', 
                          marginBottom: '0.75rem', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          border: '1px solid var(--glass-border)'
                       }}
                    >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <User size={20} color="var(--primary)" />
                          </div>
                          <div>
                             <h4 style={{ fontWeight: 800, color: '#fff' }}>{student.name}</h4>
                             <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{student.team || '소속 없음'}</p>
                          </div>
                       </div>
                       <ChevronRight size={18} color="var(--muted)" />
                    </button>
                 ))}
              </div>
            </div>
          ) : (
            /* Phase 2: Individual Player Calendar Grid */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Individual Month Selector */}
              <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{monthName}</span>
                <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
              </div>

              {/* Guide */}
              <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><CheckCircle2 size={16} color="var(--primary)" /> 출석</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><Wallet size={16} color="var(--accent)" /> 결제</span>
              </div>

              {/* Vertical Scrollable List of Days */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const attendLog = logs.find(l => l.studentId === selectedStudentId && (l.date === dateStr || l.date.replace(/\. /g, '-').replace(/\.$/, '') === dateStr) && l.type === 'attendance');
                  const paymentLog = logs.find(l => l.studentId === selectedStudentId && (l.date === dateStr || l.date.replace(/\. /g, '-').replace(/\.$/, '') === dateStr) && l.type === 'payment');

                  return (
                    <div 
                       key={day} 
                       className="glass"
                       style={{ 
                          padding: '1.25rem 1rem', 
                          marginBottom: '0.75rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          borderRadius: '1.25rem',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)'
                       }}
                    >
                      <div style={{ width: '60px', fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>{day}일</div>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <button 
                           onClick={() => recordGridCheck(selectedStudentId, dateStr, 'attendance', !attendLog)}
                           style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              background: attendLog ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                              border: 'none',
                              padding: '0.6rem',
                              borderRadius: '1rem',
                              color: attendLog ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                              width: '64px',
                              transition: 'all 0.2s ease'
                           }}
                        >
                           {attendLog ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                           <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>출석</span>
                        </button>
                        <button 
                           onClick={() => recordGridCheck(selectedStudentId, dateStr, 'payment', !paymentLog)}
                           style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              background: paymentLog ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)',
                              border: 'none',
                              padding: '0.6rem',
                              borderRadius: '1rem',
                              color: paymentLog ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                              width: '64px',
                              transition: 'all 0.2s ease'
                           }}
                        >
                           {paymentLog ? <Wallet size={32} /> : <Circle size={32} />}
                           <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>결제</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MonthlyChecklistModal;
