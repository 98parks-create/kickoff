import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface Student {
  id: string;
  coach_id: string; // NEW: Required for Supabase
  name: string;
  contact: string;
  dob: string;
  position: string;
  goal: 'Hobby' | 'Pro' | 'Elite' | '취미' | '엘리트';
  joinedDate: string;
  lessonType: 'Private' | 'Group';
  totalSessions: number;
  remainingSessions: number;
  paymentStatus: 'Paid' | 'Pending';
  team?: string;
  pricePerLesson?: number;
  preferredFoot?: 'Left' | 'Right' | 'Both' | '왼발' | '오른발' | '양발';
  lessonLocation?: string;
  lastComment?: string;
  eliteStatus?: string;
  paymentDate?: string;
  depositorName?: string;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  coach_id: string; // NEW
  date: string;
  time: string;
  comment?: string;
  isInjury?: boolean;
}

interface AppContextType {
  students: Student[];
  logs: AttendanceLog[];
  session: Session | null;
  loading: boolean;
  addStudent: (student: Omit<Student, 'id' | 'coach_id' | 'joinedDate'>) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  recordAttendance: (studentId: string, comment?: string, isInjury?: boolean) => Promise<void>;
  updateLog: (logId: string, updatedComment: string) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  confirmPayment: (studentId: string, depositorName: string) => Promise<void>;
  resetPayment: (studentId: string) => Promise<void>;
  addComment: (studentId: string, comment: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    // 1. Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) syncAndFetch(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        syncAndFetch(session);
      } else {
        setStudents([]);
        setLogs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncAndFetch = async (currentSession: Session) => {
    try {
      // 1. Fetch initial cloud data first to check if we need migration
      const { data: cloudStudents } = await supabase
        .from('students')
        .select('id')
        .eq('coach_id', currentSession.user.id)
        .limit(1);

      // 2. Local to Cloud Migration (Sync) - Only if cloud is empty
      const localStudents = localStorage.getItem('kickoff_students');
      if (localStudents && (!cloudStudents || cloudStudents.length === 0)) {
        const parsed: Student[] = JSON.parse(localStudents);
        if (parsed.length > 0) {
          const toUpload = parsed.map(s => {
            const { id, ...rest } = s; 
            return { ...rest, coach_id: currentSession.user.id };
          });
          await supabase.from('students').insert(toUpload);
          localStorage.removeItem('kickoff_students');
          localStorage.removeItem('kickoff_logs');
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Initial sync failed:', err);
      // Still try to fetch data even if sync fails
      await fetchData();
    }
  };

  const fetchData = async () => {
    try {
      const { data: studentsData } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      const { data: logsData } = await supabase.from('attendance_logs').select('*').order('created_at', { ascending: false });
      
      if (studentsData) {
        setStudents(studentsData.map(s => ({
          ...s,
          joinedDate: s.joined_date,
          lessonType: s.lesson_type,
          totalSessions: s.total_sessions,
          remainingSessions: s.remaining_sessions,
          paymentStatus: s.payment_status,
          pricePerLesson: s.price_per_lesson,
          preferredFoot: s.preferred_foot,
          lessonLocation: s.lesson_location,
          eliteStatus: s.elite_status,
          paymentDate: s.payment_date,
          depositorName: s.depositor_name
        })));
      }
      if (logsData) {
        setLogs(logsData.map(l => ({ ...l, studentId: l.student_id, isInjury: l.is_injury })));
      }
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'coach_id' | 'joinedDate'>) => {
    if (!session) return;
    const { error } = await supabase.from('students').insert({
      coach_id: session.user.id,
      name: studentData.name,
      contact: studentData.contact,
      dob: studentData.dob,
      position: studentData.position,
      goal: studentData.goal,
      lesson_type: studentData.lessonType,
      total_sessions: studentData.totalSessions,
      remaining_sessions: studentData.remainingSessions,
      payment_status: studentData.paymentStatus,
      team: studentData.team,
      price_per_lesson: studentData.pricePerLesson,
      preferred_foot: studentData.preferredFoot,
      lesson_location: studentData.lessonLocation,
      elite_status: studentData.eliteStatus
    }).select().single();

    if (!error) fetchData();
  };

  const updateStudent = async (updatedStudent: Student) => {
    await supabase.from('students').update({
      name: updatedStudent.name,
      contact: updatedStudent.contact,
      dob: updatedStudent.dob,
      position: updatedStudent.position,
      goal: updatedStudent.goal,
      lesson_type: updatedStudent.lessonType,
      total_sessions: updatedStudent.totalSessions,
      remaining_sessions: updatedStudent.remainingSessions,
      payment_status: updatedStudent.paymentStatus,
      team: updatedStudent.team,
      price_per_lesson: updatedStudent.pricePerLesson,
      preferred_foot: updatedStudent.preferredFoot,
      lesson_location: updatedStudent.lessonLocation,
      elite_status: updatedStudent.eliteStatus,
      payment_date: updatedStudent.paymentDate,
      depositor_name: updatedStudent.depositorName
    }).eq('id', updatedStudent.id);
    fetchData();
  };

  const recordAttendance = async (studentId: string, comment?: string, isInjury?: boolean) => {
    if (!session) return;
    const student = students.find(s => s.id === studentId);
    if (!student || student.remainingSessions <= 0) return;

    // 1. Update Student Sessions
    await supabase.from('students').update({
      remaining_sessions: student.remainingSessions - 1,
    }).eq('id', studentId);

    // 2. Add Log
    await supabase.from('attendance_logs').insert({
      student_id: studentId,
      coach_id: session.user.id,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      comment,
      is_injury: isInjury
    });

    fetchData();
  };

  const updateLog = async (logId: string, updatedComment: string) => {
    await supabase.from('attendance_logs').update({ comment: updatedComment }).eq('id', logId);
    fetchData();
  };

  const deleteLog = async (logId: string) => {
    const logToDelete = logs.find(l => l.id === logId);
    if (!logToDelete) return;

    const student = students.find(s => s.id === logToDelete.studentId);
    if (student) {
      await supabase.from('students').update({ remaining_sessions: student.remainingSessions + 1 }).eq('id', student.id);
    }
    
    await supabase.from('attendance_logs').delete().eq('id', logId);
    fetchData();
  };

  const deleteStudent = async (studentId: string) => {
    await supabase.from('students').delete().eq('id', studentId);
    fetchData();
  };

  const confirmPayment = async (studentId: string, depositorName: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    await supabase.from('students').update({ 
      payment_status: 'Paid', 
      payment_date: new Date().toISOString(),
      depositor_name: depositorName,
      remaining_sessions: student.totalSessions 
    }).eq('id', studentId);
    fetchData();
  };

  const resetPayment = async (studentId: string) => {
    await supabase.from('students').update({ 
      payment_status: 'Pending', 
      payment_date: null,
      depositor_name: null
    }).eq('id', studentId);
    fetchData();
  };

  const addComment = async (studentId: string, comment: string) => {
    if (!session) return;
    await supabase.from('attendance_logs').insert({
      student_id: studentId,
      coach_id: session.user.id,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      comment
    });
    fetchData();
  };

  return (
    <AppContext.Provider value={{ 
      students, logs, session, loading, addStudent, updateStudent, recordAttendance, updateLog, deleteLog, deleteStudent, confirmPayment, resetPayment, addComment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
