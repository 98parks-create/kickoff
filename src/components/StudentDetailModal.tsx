import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, type Student } from '../context/AppContext';
import { X, Calendar, MapPin, Briefcase, Footprints, Trophy, Trash2, Edit3, Check, CreditCard, Save, Share2, Users } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

const StudentDetailModal: React.FC<Props> = ({ student, onClose }) => {
  const [editValue, setEditValue] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const { logs, updateLog, deleteLog, updateStudent, addComment } = useAppContext();
  
  // Profile edit mode
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student>(student);

  const studentLogs = logs.filter(l => l.studentId === student.id);

  const handleEditStart = (id: string, text: string) => {
    setEditingLogId(id);
    setEditValue(text);
  };

  const handleSaveLog = (id: string) => {
    updateLog(id, editValue);
    setEditingLogId(null);
  };

  const handleSaveProfile = () => {
    updateStudent(editedStudent);
    setIsEditingProfile(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(student.id, newComment);
    setNewComment('');
    setIsAddingComment(false);
  };

  const handleShare = async () => {
    const lastLog = studentLogs[0];
    const reportText = `[Kick-Off] ${student.name} 선수 레슨 리포트\n\n` +
      `- 일시: ${lastLog?.date || '기록 없음'} ${lastLog?.time || ''}\n` +
      `- 오늘 코멘트: ${lastLog?.comment || '진행 완료'}\n` +
      `- 잔여 횟수: ${student.remainingSessions}회\n\n` +
      `열심히 훈련했습니다! ⚽️`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '레슨 리포트',
          text: reportText,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      await navigator.clipboard.writeText(reportText);
      alert('리포트가 클립보드에 복사되었습니다. 카톡이나 문자에 붙여넣어주세요!');
    }
  };

  const isGroup = student.lessonType === 'Group';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="modal-content"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'var(--glass)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: '#fff' }}
        >
          <X size={20} />
        </button>

        <header>
          {isEditingProfile ? (
            <input 
              value={editedStudent.name}
              onChange={e => setEditedStudent({...editedStudent, name: e.target.value})}
              style={{ fontSize: '1.75rem', fontWeight: 800, width: '80%', background: 'var(--glass)', border: '1px solid var(--primary)', borderRadius: '0.5rem', color: '#fff', padding: '0.5rem', marginBottom: '0.5rem' }}
            />
          ) : (
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{student.name}</h1>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isEditingProfile ? (
              <input 
                value={editedStudent.contact}
                onChange={e => setEditedStudent({...editedStudent, contact: e.target.value})}
                style={{ width: '60%', background: 'var(--glass)', border: '1px solid var(--primary)', borderRadius: '0.5rem', color: '#fff', padding: '0.25rem' }}
              />
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{student.contact}</p>
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleShare}
                className="glass"
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Share2 size={14} />
                리포트 공유
              </button>
              <button 
                onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                className="glass"
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', color: isEditingProfile ? 'var(--primary)' : 'var(--muted)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isEditingProfile ? <Save size={14} /> : <Edit3 size={14} />}
                {isEditingProfile ? '저장' : '정보 수정'}
              </button>
            </div>
          </div>
        </header>

        <div className="detail-grid">
          {!isGroup && (
            <div className="detail-item">
              <label><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 생년월일</label>
              {isEditingProfile ? (
                <input 
                  type="date"
                  value={editedStudent.dob}
                  onChange={e => setEditedStudent({...editedStudent, dob: e.target.value})}
                  style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
                />
              ) : (
                <span>{student.dob}</span>
              )}
            </div>
          )}
          
          <div className="detail-item">
            <label><Trophy size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> {isGroup ? '그룹 유형' : '소속팀'}</label>
            {isEditingProfile ? (
              <input 
                value={editedStudent.team}
                onChange={e => setEditedStudent({...editedStudent, team: e.target.value})}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
                placeholder={isGroup ? "예: 엘리트 그룹" : "팀명 입력"}
              />
            ) : (
              <span>{student.team || (isGroup ? '일반 그룹' : '데이터 없음')}</span>
            )}
          </div>

          {!isGroup && (
            <>
              <div className="detail-item">
                <label><Footprints size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 주발</label>
                {isEditingProfile ? (
                  <select 
                    value={editedStudent.preferredFoot}
                    onChange={e => setEditedStudent({...editedStudent, preferredFoot: e.target.value as any})}
                    style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
                  >
                    <option value="오른발">오른발</option>
                    <option value="왼발">왼발</option>
                    <option value="양발">양발</option>
                  </select>
                ) : (
                  <span>{student.preferredFoot || '데이터 없음'}</span>
                )}
              </div>
              <div className="detail-item">
                <label><Briefcase size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 레슨 유형</label>
                {isEditingProfile ? (
                  <select 
                    value={editedStudent.goal}
                    onChange={e => setEditedStudent({...editedStudent, goal: e.target.value as any, eliteStatus: e.target.value})}
                    style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
                  >
                    <option value="취미">취미</option>
                    <option value="엘리트">엘리트</option>
                  </select>
                ) : (
                  <span>{student.eliteStatus || student.goal}</span>
                )}
              </div>
            </>
          )}

          <div className="detail-item">
            <label><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 레슨 장소</label>
            {isEditingProfile ? (
              <input 
                value={editedStudent.lessonLocation}
                onChange={e => setEditedStudent({...editedStudent, lessonLocation: e.target.value})}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
              />
            ) : (
              <span>{student.lessonLocation || '데이터 없음'}</span>
            )}
          </div>

          <div className="detail-item">
            <label><CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 결제 단가</label>
            {isEditingProfile ? (
              <input 
                type="number"
                value={editedStudent.pricePerLesson}
                onChange={e => setEditedStudent({...editedStudent, pricePerLesson: Number(e.target.value)})}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
              />
            ) : (
              <span>{student.pricePerLesson ? `${student.pricePerLesson.toLocaleString()}원` : '데이터 없음'}</span>
            )}
          </div>

          <div className="detail-item">
            <label><Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 연령 카테고리</label>
            {isEditingProfile ? (
              <select 
                value={editedStudent.ageCategory}
                onChange={e => setEditedStudent({...editedStudent, ageCategory: e.target.value})}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
              >
                <option value="U12">U12</option>
                <option value="U15">U15</option>
                <option value="U18">U18</option>
                <option value="성인">성인</option>
              </select>
            ) : (
              <span>{student.ageCategory || '데이터 없음'}</span>
            )}
          </div>

          <div className="detail-item">
            <label><Share2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 유입 경로</label>
            {isEditingProfile ? (
              <select 
                value={editedStudent.inflowRoute}
                onChange={e => setEditedStudent({...editedStudent, inflowRoute: e.target.value})}
                style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: '#fff', padding: '0.4rem' }}
              >
                <option value="소개">소개</option>
                <option value="팀 레슨">팀 레슨</option>
                <option value="SNS">SNS</option>
                <option value="포털">포털</option>
                <option value="기타">기타</option>
              </select>
            ) : (
              <span>{student.inflowRoute || '데이터 없음'}</span>
            )}
          </div>
        </div>

        <section style={{ marginTop: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            코멘트 이력
            <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{studentLogs.length}건</span>
            <button 
              onClick={() => setIsAddingComment(!isAddingComment)}
              className="glass"
              style={{ marginLeft: 'auto', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer' }}
            >
              {isAddingComment ? '취소' : '+ 새 코멘트 추가'}
            </button>
          </h3>

          {isAddingComment && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}
            >
              <input 
                autoFocus
                placeholder="코멘트를 입력하세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--primary)', borderRadius: '0.5rem', color: '#fff', padding: '0.6rem' }}
              />
              <button 
                onClick={handleAddComment}
                className="btn-primary"
                style={{ padding: '0.6rem 1rem' }}
              >
                저장
              </button>
            </motion.div>
          )}

          {studentLogs.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>기록된 레슨 이력이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {studentLogs.map((log) => (
                <div key={log.id} className="history-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{log.date} {log.time}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditStart(log.id, log.comment || '')}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => deleteLog(log.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {editingLogId === log.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--primary)', borderRadius: '0.5rem', color: '#fff', padding: '0.5rem' }}
                      />
                      <button 
                        onClick={() => handleSaveLog(log.id)}
                        className="btn-primary" 
                        style={{ padding: '0.5rem' }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{log.comment || '코멘트 없음'}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </motion.div>
  );
};

export default StudentDetailModal;
