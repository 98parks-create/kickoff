import React, { useState } from 'react';
import { useAppContext, type Student } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, MessageSquare, Search, Edit2, Trash2, ArrowRight } from 'lucide-react';
import StudentDetailModal from '../components/StudentDetailModal';

const Dashboard: React.FC = () => {
  const { students, recordAttendance, deleteStudent, addComment } = useAppContext();
  const [view, setView] = useState<'Private' | 'Group'>('Private');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});

  const filteredStudents = students.filter(s => s.lessonType === view);

  const handleAttend = async (id: string) => {
    await recordAttendance(id, attendanceComments[id] || '');
    setAttendanceComments(prev => ({ ...prev, [id]: '' }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`${name} 선수를 삭제하시겠습니까? 관련 모든 기록이 삭제됩니다.`)) {
      await deleteStudent(id);
    }
  };

  const handleComment = async (id: string) => {
    const comment = attendanceComments[id];
    if (!comment) {
      alert('코멘트를 입력해주세요.');
      return;
    }
    await addComment(id, comment);
    setAttendanceComments(prev => ({ ...prev, [id]: '' }));
    alert('코멘트가 등록되었습니다.');
  };

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Kick-Off</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>나의 레슨 코칭 실황</p>
      </header>

      {/* Segment Control */}
      <div className="glass" style={{ 
        display: 'flex', 
        padding: '0.25rem', 
        borderRadius: '1rem', 
        marginBottom: '1rem' 
      }}>
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
            {type === 'Private' ? '개인 레슨' : '그룹 레슨'}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
        💡 선수 정보를 수정하거나 상세 기록을 보려면 상세 버튼을 누르세요.
      </p>

      <AnimatePresence>
        {students.some(s => s.remainingSessions <= 2) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card" 
            style={{ 
              marginBottom: '2rem', 
              background: 'linear-gradient(135deg, #422006 0%, #1A1A1C 100%)',
              borderColor: '#EAB308'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle color="var(--accent)" />
              <div>
                <h4 style={{ color: 'var(--accent)' }}>재등록 안내 대상자</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>잔여 횟수가 2회 이하인 학생이 있습니다.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="section-title">
        <h3>{view === 'Private' ? '수강생 목록' : '그룹 목록'}</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{filteredStudents.length}명</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredStudents.map(student => (
          <motion.div 
            layout
            key={student.id} 
            className="premium-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{student.name}</h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="glass"
                      style={{ padding: '0.3rem', borderRadius: '0.5rem', color: 'var(--muted)', border: 'none' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id, student.name)}
                      className="glass"
                      style={{ padding: '0.3rem', borderRadius: '0.5rem', color: '#EF4444', border: 'none' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {student.lessonType === 'Private' && <span className="badge badge-green">{student.position}</span>}
                  <span className="badge badge-yellow">{student.lessonType === 'Group' ? '그룹 레슨' : student.goal}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: student.remainingSessions <= 2 ? '#EF4444' : 'var(--primary)' }}>
                  {student.remainingSessions}회
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>잔여 횟수</div>
              </div>
            </div>

            {/* Detailed Info Button (Prominent) */}
            <button 
              onClick={() => setSelectedStudent(student)}
              className="glass"
              style={{ 
                width: '100%', 
                padding: '0.6rem', 
                borderRadius: '0.75rem', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid var(--glass-border)'
              }}
            >
              <Search size={14} />
              상세 정보 및 수정
              <ArrowRight size={14} />
            </button>

            {/* Attendance Action with Comment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                placeholder="레슨생 오늘 수업 코멘트"
                className="glass"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.85rem' }}
                value={attendanceComments[student.id] || ''}
                onChange={e => setAttendanceComments({...attendanceComments, [student.id]: e.target.value})}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 4 }}
                  onClick={() => handleAttend(student.id)}
                  disabled={student.remainingSessions === 0}
                >
                  <CheckCircle2 size={18} />
                  출석 체크
                </button>
                <button 
                  onClick={() => handleComment(student.id)}
                  className="glass" 
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    borderRadius: '1rem', 
                    color: 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal 
            student={selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
