import React, { useState } from 'react';
import { useAppContext, type Schedule } from '../context/AppContext';
import { 
  X, 
  Plus, 
  Camera, 
  Trash2, 
  Share2, 
  Clock, 
  User, 
  FileText,
  Save,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DailyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
}

const DailyScheduleModal: React.FC<DailyScheduleModalProps> = ({ onClose, date }) => {
  const { students, schedules, addSchedule, updateSchedule, deleteSchedule, uploadScheduleImage } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    time: '',
    title: '',
    description: '',
    comment: '',
    image_urls: [] as string[]
  });

  const daySchedules = schedules.filter(s => s.date === format(date, 'yyyy-MM-dd'));

  const handleAddClick = () => {
    setFormData({
      student_id: '',
      time: '',
      title: '',
      description: '',
      comment: '',
      image_urls: []
    });
    setIsAdding(true);
  };

  const handleEditClick = (schedule: Schedule) => {
    setFormData({
      student_id: schedule.student_id || '',
      time: schedule.time || '',
      title: schedule.title,
      description: schedule.description || '',
      comment: schedule.comment || '',
      image_urls: schedule.image_url ? schedule.image_url.split(',') : []
    });
    setEditingId(schedule.id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, localUrl] }));

    setLoading(true);
    try {
      const remoteUrl = await uploadScheduleImage(file);
      if (remoteUrl) {
        // 2. Replace local preview with remote URL once uploaded
        setFormData(prev => ({
          ...prev,
          image_urls: prev.image_urls.map(url => url === localUrl ? remoteUrl : url)
        }));
      } else {
        // Remove local preview if upload fails
        setFormData(prev => ({
          ...prev,
          image_urls: prev.image_urls.filter(url => url !== localUrl)
        }));
        alert('이미지 업로드에 실패했습니다.');
      }
    } finally {
      setLoading(false);
      URL.revokeObjectURL(localUrl); // Cleanup
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('일정 제목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        ...formData,
        student_id: formData.student_id || null,
        date: format(date, 'yyyy-MM-dd'),
        image_url: formData.image_urls.join(',') // Store as comma-separated string
      };

      console.log('Saving schedule data:', scheduleData);
      // Remove image_urls from the data sent to Supabase as it's not in the schema
      const { image_urls, ...finalData } = scheduleData;

      if (editingId) {
        const original = schedules.find(s => s.id === editingId);
        if (original) {
          await updateSchedule({ ...original, ...finalData });
        }
      } else {
        await addSchedule(finalData as any);
      }
      
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error('Save failed:', err);
      alert('저장에 실패했습니다. 콘솔 로그를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      await deleteSchedule(id);
    }
  };

  const handleShare = async (schedule: Schedule) => {
    const student = students.find(s => s.id === schedule.student_id);
    const imageUrls = schedule.image_url ? schedule.image_url.split(',') : [];
    
    // Format text nicely for sharing
    let shareText = `[Kick-Off 레슨 일지]\n\n`;
    shareText += `선수: ${student ? student.name : '미지정'}\n`;
    shareText += `날짜: ${format(new Date(schedule.date), 'yyyy년 M월 d일')}\n`;
    if (schedule.time) shareText += `시간: ${schedule.time}\n`;
    shareText += `제목: ${schedule.title}\n`;
    if (schedule.description) shareText += `내용: ${schedule.description}\n`;
    if (schedule.comment) shareText += `\n코치 코멘트:\n${schedule.comment}\n`;
    
    if (imageUrls.length > 0) {
      shareText += `\n훈련 사진:\n${imageUrls.join('\n')}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: '레슨 일정 및 피드백',
          text: shareText,
          // No URL here to avoid sending the app link
        });
      } catch (err) {
        console.log('Sharing failed', err);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('내용이 클립보드에 복사되었습니다. 카카오톡 등 원하는 곳에 붙여넣으세요.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ padding: '1.5rem', maxHeight: '95vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>{format(date, 'M월 d일 (E)', { locale: ko })}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>일정 목록 및 기록</p>
          </div>
          <button onClick={onClose} className="glass" style={{ padding: '0.5rem', borderRadius: '50%', border: 'none' }}>
            <X size={24} />
          </button>
        </div>

        {!isAdding && !editingId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {daySchedules.length > 0 ? (
              daySchedules.map(schedule => (
                <div key={schedule.id} className="premium-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        {schedule.time ? schedule.time.slice(0, 5) : '시간 미지정'}
                      </span>
                      <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>{schedule.title}</h3>
                      {schedule.student_id && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                          <User size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {students.find(s => s.id === schedule.student_id)?.name} 선수
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleShare(schedule)} className="glass" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', color: 'var(--accent)' }}>
                        <Share2 size={16} />
                      </button>
                      <button onClick={() => handleEditClick(schedule)} className="glass" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', color: 'var(--muted)' }}>
                        <ImageIcon size={16} />
                      </button>
                      <button onClick={() => handleDelete(schedule.id)} className="glass" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', color: '#EF4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {schedule.description && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem' }}>{schedule.description}</p>
                  )}

                  {schedule.image_url && (
                    <div style={{ display: 'grid', gridTemplateColumns: schedule.image_url.split(',').length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                      {schedule.image_url.split(',').map((url, idx) => (
                        <div key={idx} style={{ 
                          position: 'relative', 
                          borderRadius: '1rem', 
                          overflow: 'hidden', 
                          background: 'rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '200px'
                        }}>
                          <img 
                            src={url} 
                            alt={`훈련 사진 ${idx + 1}`} 
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              maxHeight: '400px',
                              objectFit: 'contain' // Prevent stretching/cropping
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {schedule.comment && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem', borderLeft: '3px solid var(--primary)' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '0.25rem', fontWeight: 700 }}>코치 코멘트</p>
                      <p>{schedule.comment}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
                일정이 없습니다. 새로운 일정을 등록해 보세요!
              </div>
            )}

            <button 
              onClick={handleAddClick}
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
            >
              <Plus size={20} />
              새 일정 추가
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="detail-item">
              <label><User size={14} /> 레슨 선수 (선택)</label>
              <select 
                value={formData.student_id}
                onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '0.5rem', color: '#fff' }}
              >
                <option value="">선수 선택 안함</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.team || '-'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="detail-item">
                <label><Clock size={14} /> 시간</label>
                <input 
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="glass"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '0.5rem', color: '#fff' }}
                />
              </div>
              <div className="detail-item">
                <label>일정 제목</label>
                <input 
                  type="text"
                  placeholder="예: 1:1 개인 레슨"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="glass"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '0.5rem', color: '#fff' }}
                />
              </div>
            </div>

            <div className="detail-item">
              <label><FileText size={14} /> 상세 설명</label>
              <textarea 
                placeholder="훈련 장소나 간단한 메모를 입력하세요."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '0.5rem', color: '#fff', minHeight: '80px', resize: 'none' }}
              />
            </div>

            <div className="detail-item">
              <label><Camera size={14} /> 사진 등록</label>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label className="glass" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    padding: '1rem', 
                    borderRadius: '1rem', 
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    fontWeight: 700
                  }}>
                    <Camera size={20} />
                    사진 촬영/선택
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                    <Loader2 size={20} className="animate-spin" />
                    업로드 중...
                  </div>
                )}

                {formData.image_urls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                    {formData.image_urls.map((url, idx) => (
                      <div key={idx} style={{ 
                        position: 'relative', 
                        borderRadius: '1rem', 
                        overflow: 'hidden', 
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '150px'
                      }}>
                        <img 
                          src={url} 
                          alt={`미리보기 ${idx + 1}`} 
                          style={{ 
                            width: '100%', 
                            height: 'auto', 
                            maxHeight: '300px',
                            objectFit: 'contain' 
                          }} 
                        />
                        <button 
                          onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', border: 'none', padding: '0.5rem', borderRadius: '50%', color: '#fff', zIndex: 10 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="detail-item">
              <label>코치 코멘트 (공유 시 포함)</label>
              <textarea 
                placeholder="훈련 성과나 피드백을 기록해 보세요."
                value={formData.comment}
                onChange={e => setFormData({ ...formData, comment: e.target.value })}
                className="glass"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '0.5rem', color: '#fff', minHeight: '100px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="glass"
                style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none', color: '#fff', fontWeight: 700 }}
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2, padding: '1rem', borderRadius: '1rem' }}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {editingId ? '수정 완료' : '일정 등록'}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        select option {
          background: var(--surface);
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default DailyScheduleModal;
