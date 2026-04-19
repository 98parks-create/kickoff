import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Wallet, 
  CheckCircle2, 
  Circle
} from 'lucide-react';

const Management: React.FC = () => {
  const { students, logs, recordGridCheck } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Date helpers
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = selectedDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  // Data processing for the selected month
  const gridData = useMemo(() => {
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === month && logDate.getFullYear() === year;
    });

    return students.map(student => {
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
  }, [students, logs, month, year]);

  const totals = gridData.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    unpaid: acc.unpaid + curr.unpaidAmount
  }), { revenue: 0, unpaid: 0 });

  return (
    <div className="management-page" style={{ padding: '1rem', color: '#fff' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>현황 관리</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>수강생 목록 및 월간 체크리스트</p>
        </div>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
          <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 700, minWidth: '100px', textAlign: 'center' }}>{monthName}</span>
          <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* 1. Summary Table Section */}
      <section className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="management-table">
            <thead>
              <tr>
                <th>순번</th>
                <th>선수 이름</th>
                <th>소속</th>
                <th>연령별카테고리</th>
                <th>유입 경로</th>
                <th>단가</th>
                <th>참여횟수</th>
                <th>결제 횟수</th>
                <th>수입</th>
                <th>미수금</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((student, idx) => (
                <tr key={student.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{student.name}</td>
                  <td>{student.team || '-'}</td>
                  <td><span className="badge badge-yellow">{student.ageCategory || 'U15'}</span></td>
                  <td><span className="badge badge-green">{student.inflowRoute || '소개'}</span></td>
                  <td>₩{(student.pricePerLesson || 0).toLocaleString()}</td>
                  <td>{student.attendanceCount}</td>
                  <td>{student.paymentCount}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 700 }}>₩{student.revenue.toLocaleString()}</td>
                  <td style={{ color: student.unpaidAmount > 0 ? '#EF4444' : 'var(--muted)' }}>₩{student.unpaidAmount.toLocaleString()}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>
                <td colSpan={8} style={{ textAlign: 'right' }}>총계</td>
                <td style={{ color: 'var(--primary)' }}>₩{totals.revenue.toLocaleString()}</td>
                <td style={{ color: '#EF4444' }}>₩{totals.unpaid.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Grid Checklist Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" />
            월간 출석 및 결제 체크리스트
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span style={{ marginRight: '1rem' }}><CheckCircle2 size={12} style={{ verticalAlign: 'middle' }}/> 출석</span>
            <span><Wallet size={12} style={{ verticalAlign: 'middle' }}/> 결제</span>
          </div>
        </div>

        <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table className="checklist-table">
              <thead>
                <tr>
                  <th className="sticky-col">날짜</th>
                  {students.map(s => (
                    <th key={s.id} colSpan={2} style={{ minWidth: '120px' }}>
                      {s.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky-col" style={{ top: '40px' }}></th>
                  {students.map(s => (
                    <React.Fragment key={s.id}>
                      <th className="sub-th" style={{ top: '40px' }}>출석</th>
                      <th className="sub-th" style={{ top: '40px' }}>결제</th>
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
                      <td className="sticky-col day-cell">{day}일</td>
                      {students.map(s => {
                        const attendLog = logs.find(l => l.studentId === s.id && l.date === dateStr && l.type === 'attendance');
                        const paymentLog = logs.find(l => l.studentId === s.id && l.date === dateStr && l.type === 'payment');
                        
                        return (
                          <React.Fragment key={s.id}>
                            <td className="check-cell">
                              <button 
                                onClick={() => recordGridCheck(s.id, dateStr, 'attendance', !attendLog)}
                                className={`check-btn ${attendLog ? 'checked' : ''}`}
                              >
                                {attendLog ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                            </td>
                            <td className="check-cell">
                              <button 
                                onClick={() => recordGridCheck(s.id, dateStr, 'payment', !paymentLog)}
                                className={`check-btn payment ${paymentLog ? 'checked' : ''}`}
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
      </section>

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
          min-width: 1000px;
        }
        .management-table th, .management-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }
        .management-table th {
          background: rgba(255,255,255,0.05);
          color: var(--muted);
          font-weight: 600;
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
        }
        .day-cell {
          font-weight: 700;
          color: var(--muted);
        }
        .check-cell {
          padding: 0.25rem;
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
          padding: 0.5rem 0;
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
