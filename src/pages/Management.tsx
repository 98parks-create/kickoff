import React, { useState, useMemo } from 'react';
import { useAppContext, type Student } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Edit2, 
  Trash2,
  CheckSquare,
  Users
} from 'lucide-react';
import MonthlyChecklistModal from '../components/MonthlyChecklistModal';
import StudentDetailModal from '../components/StudentDetailModal';

const Management: React.FC = () => {
  const { students, logs, deleteStudent } = useAppContext();
  const [view, setView] = useState<'Private' | 'Group'>('Private');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Date helpers
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  // Data processing for the selected month
  const gridData = useMemo(() => {
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === month && logDate.getFullYear() === year;
    });

    return students
      .filter(s => s.lessonType === view)
      .map(student => {
        const studentLogs = monthLogs.filter(l => l.studentId === student.id);
        
        const attendanceCount = studentLogs.filter(l => l.type === 'attendance').length;
        const paymentCount = studentLogs.filter(l => l.type === 'payment').length;
        const revenue = (student.pricePerLesson || 0) * paymentCount;
        const unpaidAmount = Math.max(0, (student.pricePerLesson || 0) * attendanceCount - revenue);

        return {
          ...student,
          attendanceCount,
          paymentCount,
          revenue,
          unpaidAmount
        };
      });
  }, [students, logs, month, year, view]);

  const totals = gridData.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    unpaid: acc.unpaid + curr.unpaidAmount
  }), { revenue: 0, unpaid: 0 });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`${name} 선수를 삭제하시겠습니까? 관련 모든 기록이 삭제됩니다.`)) {
      await deleteStudent(id);
    }
  };

  return (
    <div className="management-page" style={{ padding: '1rem', color: '#fff' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>현황 관리</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>수강생 목록 및 월간 체크리스트 통합 대시보드</p>
          </div>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 700, minWidth: '100px', textAlign: 'center' }}>{monthName}</span>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Lesson Type Filter */}
        <div className="glass" style={{ display: 'flex', padding: '0.25rem', borderRadius: '1rem', maxWidth: '400px' }}>
          {(['Private', 'Group'] as const).map(type => (
            <button
              key={type}
              onClick={() => setView(type)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: view === type ? 'var(--primary)' : 'transparent',
                color: view === type ? '#000' : 'var(--muted)',
                borderRadius: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={18} />
              {type === 'Private' ? '개인 레슨' : '그룹 레슨'}
            </button>
          ))}
        </div>
      </header>

      {/* Re-registration Alert */}
      <AnimatePresence>
        {students.some(s => s.remainingSessions <= 2) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card" 
            style={{ 
              marginBottom: '2rem', 
              background: 'linear-gradient(135deg, #422006 0%, #1A1A1C 100%)',
              borderColor: '#EAB308',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <AlertCircle color="var(--accent)" />
            <div>
              <h4 style={{ color: 'var(--accent)' }}>재등록 안내 대상자</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>잔여 횟수가 2회 이하인 학생이 있습니다.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>{view === 'Private' ? '수강생 목록' : '그룹 목록'} ({gridData.length}명)</h3>
        <button 
          onClick={() => setIsChecklistOpen(true)}
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
        >
          <CheckSquare size={16} />
          {month + 1}월 통합 체크리스트 열기
        </button>
      </div>

      {/* 1. Summary Table Section */}
      <section className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="management-table">
            <thead>
              <tr>
                <th>순번</th>
                <th>선수 이름</th>
                <th>소속</th>
                <th>연령</th>
                <th>유입</th>
                <th>단가</th>
                <th>참여</th>
                <th>결제</th>
                <th>수입</th>
                <th>미수금</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((student, idx) => (
                <tr key={student.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{student.name}</td>
                  <td>{student.team || '-'}</td>
                  <td><span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>{student.ageCategory || 'U15'}</span></td>
                  <td><span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{student.inflowRoute || 'SNS'}</span></td>
                  <td>₩{(student.pricePerLesson || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{student.attendanceCount}</td>
                  <td style={{ fontWeight: 600 }}>{student.paymentCount}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₩{student.revenue.toLocaleString()}</td>
                  <td style={{ color: student.unpaidAmount > 0 ? '#EF4444' : 'var(--muted)', fontWeight: 700 }}>
                    ₩{student.unpaidAmount.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="glass"
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', color: 'var(--muted)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id, student.name)}
                        className="glass"
                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', color: '#EF4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>
                <td colSpan={8} style={{ textAlign: 'right', color: 'var(--muted)' }}>선택 월 합계</td>
                <td style={{ color: 'var(--primary)', fontSize: '1rem' }}>₩{totals.revenue.toLocaleString()}</td>
                <td style={{ color: '#EF4444', fontSize: '1rem' }}>₩{totals.unpaid.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <MonthlyChecklistModal 
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        viewType={view}
      />

      <AnimatePresence>
        {editingStudent && (
          <StudentDetailModal 
            student={editingStudent} 
            onClose={() => setEditingStudent(null)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .nav-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.1); }

        .management-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 900px;
        }
        .management-table th, .management-table td {
          padding: 1rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }
        .management-table th {
          background: rgba(255,255,255,0.03);
          color: var(--muted);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .checklist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .checklist-table th, .checklist-table td {
          border: 1px solid var(--glass-border);
          text-align: center;
        }
        .checklist-table th {
          padding: 0.5rem;
          background: rgba(0,0,0,0.3);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .sub-th {
          font-size: 0.7rem;
          color: var(--muted);
        }
        .sticky-col {
          position: sticky;
          left: 0;
          background: #1a1a1c !important;
          z-index: 11;
          width: 60px;
          min-width: 60px;
          border-right: 2px solid var(--glass-border) !important;
        }
        .day-cell {
          font-weight: 700;
          color: var(--muted);
        }
        .check-cell {
          padding: 0;
        }
        .check-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .check-btn.checked {
          color: var(--primary);
        }
        .check-btn.payment.checked {
          color: var(--accent);
        }
        .check-btn:hover {
          background: rgba(255,255,255,0.05);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default Management;
