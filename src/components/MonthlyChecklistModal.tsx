import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Wallet, 
  CheckCircle2, 
  Circle 
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

  // Date helpers
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  const filteredStudents = students.filter(s => s.lessonType === viewType);

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
            maxWidth: '100%' 
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--primary)" />
                월간 출석 및 결제 체크
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{viewType === 'Private' ? '개인 레슨' : '그룹 레슨'} 목록</p>
            </div>
            <button 
              onClick={onClose}
              className="glass"
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Month Selector Column */}
          <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{monthName}</span>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
          </div>

          {/* Guide */}
          <div style={{ padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--muted)', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} color="var(--primary)" /> 출석</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Wallet size={12} color="var(--accent)" /> 결제</span>
          </div>

          {/* Grid View */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 0.5rem 2rem' }}>
            <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <table className="checklist-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                  <tr>
                    <th className="sticky-col" style={{ width: '60px', background: '#1A1A1C', borderBottom: '2px solid var(--glass-border)' }}>날짜</th>
                    {filteredStudents.map(s => (
                      <th key={s.id} colSpan={2} style={{ padding: '0.75rem', background: '#1A1A1C', borderBottom: '2px solid var(--glass-border)', minWidth: '120px' }}>
                        {s.name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="sticky-col" style={{ visibility: 'hidden', height: 0, padding: 0, border: 'none' }}></th>
                    {filteredStudents.map(s => (
                      <React.Fragment key={s.id}>
                        <th className="sub-th" style={{ background: '#262629', fontSize: '0.65rem', padding: '0.25rem' }}>출석</th>
                        <th className="sub-th" style={{ background: '#262629', fontSize: '0.65rem', padding: '0.25rem' }}>결제</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}. ${month + 1}. ${day}.`;
                    
                    return (
                      <tr key={day}>
                        <td className="sticky-col day-cell" style={{ zIndex: 90, background: '#1A1A1C' }}>{day}일</td>
                        {filteredStudents.map(s => {
                          const attendLog = logs.find(l => l.studentId === s.id && l.date === dateStr && l.type === 'attendance');
                          const paymentLog = logs.find(l => l.studentId === s.id && l.date === dateStr && l.type === 'payment');
                          
                          return (
                            <React.Fragment key={s.id}>
                              <td className="check-cell" style={{ borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
                                <button 
                                  onClick={() => recordGridCheck(s.id, dateStr, 'attendance', !attendLog)}
                                  className={`check-btn ${attendLog ? 'checked' : ''}`}
                                  style={{ padding: '0.75rem 0' }}
                                >
                                  {attendLog ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </button>
                              </td>
                              <td className="check-cell" style={{ borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>
                                <button 
                                  onClick={() => recordGridCheck(s.id, dateStr, 'payment', !paymentLog)}
                                  className={`check-btn payment ${paymentLog ? 'checked' : ''}`}
                                  style={{ padding: '0.75rem 0' }}
                                >
                                  {paymentLog ? <Wallet size={18} /> : <Circle size={18} />}
                                </button>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MonthlyChecklistModal;
