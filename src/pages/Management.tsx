import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, type Student } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Edit2, 
  Trash2,
  CheckSquare,
  Users,
  Search,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import MonthlyChecklistModal from '../components/MonthlyChecklistModal';
import StudentDetailModal from '../components/StudentDetailModal';

const ITEMS_PER_PAGE = 15;

const Management: React.FC = () => {
  const { students, logs, deleteStudent } = useAppContext();
  const [view, setView] = useState<'Private' | 'Group'>('Private');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filtering based on search
  const filteredData = useMemo(() => {
    return gridData.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.team && s.team.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [gridData, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totals = filteredData.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    unpaid: acc.unpaid + curr.unpaidAmount
  }), { revenue: 0, unpaid: 0 });

  // Reset page when search or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, view]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`${name} 선수를 삭제하시겠습니까? 관련 모든 기록이 삭제됩니다.`)) {
      await deleteStudent(id);
    }
  };

  return (
    <div className="management-page" style={{ padding: '1rem', color: '#fff' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>현황 관리</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>수강생 목록 및 월간 체크리스트 통합 대시보드</p>
          </div>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.6rem 1.25rem', borderRadius: '1.25rem' }}>
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
            <span style={{ fontWeight: 800, minWidth: '100px', textAlign: 'center', fontSize: '1.1rem' }}>{monthName}</span>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="filter-search-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Lesson Type Filter */}
          <div className="glass" style={{ display: 'flex', padding: '0.25rem', borderRadius: '1rem', minWidth: '240px' }}>
            {(['Private', 'Group'] as const).map(type => (
              <button
                key={type}
                onClick={() => setView(type)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  background: view === type ? 'var(--primary)' : 'transparent',
                  color: view === type ? '#000' : 'var(--muted)',
                  borderRadius: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                <Users size={16} />
                {type === 'Private' ? '개인 레슨' : '그룹 레슨'}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="glass" style={{ 
            flex: 1, 
            minWidth: '280px', 
            maxWidth: '500px',
            display: 'flex', 
            alignItems: 'center', 
            padding: '0.25rem 1rem', 
            borderRadius: '1rem',
            border: '1px solid var(--glass-border)'
          }}>
            <Search size={18} color="var(--muted)" style={{ marginRight: '0.75rem' }} />
            <input 
              type="text"
              placeholder="레슨생 이름 또는 소속 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#fff', 
                width: '100%', 
                padding: '0.6rem 0',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>
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
              gap: '1.25rem'
            }}
          >
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '0.75rem', borderRadius: '1rem' }}>
              <AlertCircle color="var(--accent)" size={24} />
            </div>
            <div>
              <h4 style={{ color: 'var(--accent)', fontWeight: 800 }}>재등록안내 대상 발생!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>잔여 횟수가 2회 이하인 선수가 있습니다. 테이블에서 확인하세요.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button & Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
          {view === 'Private' ? '개인 레슨생' : '그룹 레슨팀'} 명단 ({filteredData.length})
        </h3>
        <button 
          onClick={() => setIsChecklistOpen(true)}
          className="btn-primary"
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '0.875rem' }}
        >
          <CheckSquare size={18} />
          {month + 1}월 출석/결제 관리
        </button>
      </div>

      {/* 1. Summary Table Section */}
      <section className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="management-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>#</th>
                <th style={{ width: '12%' }}>선수<span className="mobile-hide-text"> 이름</span></th>
                <th style={{ width: '10%', minWidth: '40px' }}>소속</th>
                <th style={{ width: '8%' }}>연령</th>
                <th style={{ width: '8%' }}>유입</th>
                <th style={{ width: '10%' }}>단가</th>
                <th style={{ width: '6%' }}>참<span className="mobile-hide-text">여</span></th>
                <th style={{ width: '6%' }}>결<span className="mobile-hide-text">제</span></th>
                <th style={{ width: '13%' }}>수입</th>
                <th style={{ width: '13%' }}>미수<span className="mobile-hide-text">금</span></th>
                <th style={{ textAlign: 'center', width: '10%' }}>관<span className="mobile-hide-text">리</span></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((student, idx) => (
                <tr key={student.id}>
                  <td style={{ color: 'var(--muted)', fontWeight: 500 }}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  <td style={{ fontWeight: 800, fontSize: '1rem' }}>{student.name}</td>
                  <td>{student.team || '-'}</td>
                  <td><span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>{student.ageCategory || 'U15'}</span></td>
                  <td><span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{student.inflowRoute || '소개'}</span></td>
                  <td style={{ fontWeight: 600 }}>₩{(student.pricePerLesson || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{student.attendanceCount}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{student.paymentCount}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 800 }}>₩{student.revenue.toLocaleString()}</td>
                  <td style={{ color: student.unpaidAmount > 0 ? '#EF4444' : 'var(--muted)', fontWeight: 800 }}>
                    ₩{student.unpaidAmount.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="glass"
                        style={{ padding: '0.5rem', borderRadius: '0.6rem', border: 'none', color: 'var(--muted)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id, student.name)}
                        className="glass"
                        style={{ padding: '0.5rem', borderRadius: '0.6rem', border: 'none', color: '#EF4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
                    {searchTerm ? `'${searchTerm}'에 대한 검색 결과가 없습니다.` : '등록된 레슨생이 없습니다.'}
                  </td>
                </tr>
              )}
              {/* Total Row (Based on filtered search, not just page) */}
              <tr style={{ background: 'rgba(34, 197, 94, 0.05)', fontWeight: 800 }}>
                <td colSpan={8} style={{ textAlign: 'right', color: 'var(--muted)', padding: '1.25rem' }}>검색/필터 결과 총계</td>
                <td style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₩{totals.revenue.toLocaleString()}</td>
                <td style={{ color: '#EF4444', fontSize: '1.1rem' }}>₩{totals.unpaid.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--glass-border)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '1rem' 
          }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="nav-btn pagination-btn"
            ><ChevronFirst size={18} /></button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="nav-btn pagination-btn"
            ><ChevronLeft size={18} /></button>
            
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>
              Page <span style={{ color: '#fff' }}>{currentPage}</span> of {totalPages}
            </span>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="nav-btn pagination-btn"
            ><ChevronRight size={18} /></button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="nav-btn pagination-btn"
            ><ChevronLast size={18} /></button>
          </div>
        )}
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
        .pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .pagination-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }

        .management-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          table-layout: fixed; /* Fix table layout for predictable column widths */
        }
        .management-table th, .management-table td {
          padding: 1.1rem 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .management-table th {
          background: rgba(255,255,255,0.02);
          color: var(--muted);
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 850px) {
          .management-page {
            padding: 0.5rem;
          }
          .management-table {
            font-size: 0.7rem;
          }
          .management-table th, .management-table td {
            padding: 0.6rem 0.2rem; /* Extreme tight padding */
          }
          .management-table th {
            font-size: 0.6rem;
          }
          .badge {
            padding: 0.1rem 0.3rem;
            font-size: 0.55rem;
          }
        }

        @media (max-width: 600px) {
          .header-row {
            flex-direction: column;
            align-items: stretch !important;
          }
          .filter-search-container {
            flex-direction: column;
            align-items: stretch !important;
          }
          .management-table {
            font-size: 0.65rem;
          }
          .mobile-hide-text {
            display: none;
          }
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
        .check-btn.checked {
          color: var(--primary);
        }
        .check-btn.payment.checked {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
};

export default Management;
