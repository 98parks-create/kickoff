import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import DailyScheduleModal from '../components/DailyScheduleModal.tsx';

const Calendar: React.FC = () => {
  const { schedules } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const getSchedulesForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return schedules.filter(s => s.date === dateStr);
  };

  return (
    <div className="calendar-page" style={{ color: '#fff' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>스케줄 관리</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>레슨 일정 및 훈련 기록</p>
        </div>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.6rem 1.25rem', borderRadius: '1.25rem' }}>
          <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 800, minWidth: '120px', textAlign: 'center', fontSize: '1.1rem' }}>
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <button onClick={nextMonth} className="nav-btn"><ChevronRight size={20} /></button>
        </div>
      </header>

      <section className="glass" style={{ borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div key={day} style={{ 
              textAlign: 'center', 
              color: idx === 0 ? '#EF4444' : idx === 6 ? '#3B82F6' : 'var(--muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem'
            }}>
              {day}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {days.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={day.toString()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDateClick(day)}
                style={{
                  minHeight: '100px',
                  padding: '0.5rem',
                  borderRadius: '1rem',
                  background: isToday ? 'rgba(34, 197, 94, 0.1)' : isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: isToday ? '1px solid var(--primary)' : isSelected ? '1px solid var(--glass-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  color: day.getDay() === 0 ? '#EF4444' : day.getDay() === 6 ? '#3B82F6' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {format(day, 'd')}
                  {isToday && <span style={{ fontSize: '0.6rem', background: 'var(--primary)', color: '#000', padding: '1px 4px', borderRadius: '4px' }}>오늘</span>}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  {daySchedules.slice(0, 3).map(s => (
                    <div key={s.id} style={{ 
                      fontSize: '0.7rem', 
                      background: 'var(--surface)', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      borderLeft: '2px solid var(--primary)'
                    }}>
                      {s.time ? `${s.time.slice(0, 5)} ` : ''}{s.title}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center' }}>
                      +{daySchedules.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <DailyScheduleModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            date={selectedDate}
          />
        )}
      </AnimatePresence>

      <style>{`
        .nav-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        @media (max-width: 600px) {
          .calendar-page header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .calendar-page .glass {
            width: 100%;
            justify-content: space-between;
          }
          section.glass {
            padding: 0.75rem !important;
            margin: 0 -0.25rem;
          }
          div[style*="grid-template-columns: repeat(7, 1fr)"] {
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
            gap: 0.25rem !important;
          }
          div[style*="min-height: 100px"] {
            min-height: 60px !important;
            padding: 0.25rem !important;
          }
          div[style*="font-size: 0.9rem"] {
            font-size: 0.75rem !important;
          }
          .nav-btn {
            padding: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Calendar;
