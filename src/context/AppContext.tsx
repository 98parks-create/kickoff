import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface Student {
  id: string;
  coach_id: string;
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
  // NEW FIELDS
  ageCategory?: 'U12' | 'U15' | 'U18' | '성인' | string;
  inflowRoute?: '팀 레슨' | '소개' | 'SNS' | '포털' | '기타' | string;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  coach_id: string;
  date: string;
  time: string;
  comment?: string;
  isInjury?: boolean;
  type?: 'attendance' | 'payment'; // NEW
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
  recordGridCheck: (studentId: string, date: string, type: 'attendance' | 'payment', checked: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    let cleanupSubs: (() => void) | null = null;

    // 1. Auth Listener with safety timeout
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          syncAndFetch(session);
          cleanupSubs = setupSubscriptions(session.user.id);
        }
      })
      .finally(() => {
        clearTimeout(loadTimeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (cleanupSubs) cleanupSubs();
      if (session) {
        syncAndFetch(session);
        cleanupSubs = setupSubscriptions(session.user.id);
      } else {
        setStudents([]);
        setLogs([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (cleanupSubs) cleanupSubs();
      clearTimeout(loadTimeout);
    };
  }, []);

  const setupSubscriptions = (userId: string) => {
    const studentSub = supabase
      .channel(`students-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students',
        filter: `coach_id=eq.${userId}`
      }, () => fetchData())
      .subscribe();

    const logSub = supabase
      .channel(`logs-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance_logs',
        filter: `coach_id=eq.${userId}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(studentSub);
      supabase.removeChannel(logSub);
    };
  };

  const syncAndFetch = async (currentSession: Session) => {
    try {
      const { data: cloudStudents } = await supabase
        .from('students')
        .select('id')
        .eq('coach_id', currentSession.user.id)
        .limit(1);

      const localStudents = localStorage.getItem('kickoff_students');
      if (localStudents && (!cloudStudents || cloudStudents.length === 0)) {
        const parsed: Student[] = JSON.parse(localStudents);
        if (parsed.length > 0) {
          const toUpload = parsed.map(s => ({
            coach_id: currentSession.user.id,
            name: s.name,
            contact: s.contact,
            dob: s.dob,
            position: s.position,
            goal: s.goal,
            lesson_type: s.lessonType,
            total_sessions: s.totalSessions,
            remaining_sessions: s.remainingSessions,
            payment_status: s.paymentStatus,
            team: s.team,
            price_per_lesson: s.pricePerLesson,
            preferred_foot: s.preferredFoot,
            lesson_location: s.lessonLocation,
            elite_status: s.eliteStatus || s.goal,
            payment_date: s.paymentDate,
            depositor_name: s.depositorName,
            age_category: s.ageCategory,
            inflow_route: s.inflowRoute
          }));
          await supabase.from('students').insert(toUpload);
          localStorage.removeItem('kickoff_students');
          localStorage.removeItem('kickoff_logs');
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Initial sync failed:', err);
      await fetchData();
    }
  };

  const fetchData = async () => {
    if (!session) return;
    try {
      // 1. Strict filtering: only fetch students belonging to THIS coach
      const { data: studentsData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false });
      
      const { data: logsData, error: lError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false });

      if (sError) console.error('Student fetch error:', sError);
      if (lError) console.error('Logs fetch error:', lError);
      
      if (studentsData) {
        setStudents(studentsData.map(s => ({
          ...s,
          joinedDate: s.joined_date || s.created_at,
          lessonType: s.lesson_type,
          totalSessions: s.total_sessions,
          remainingSessions: s.remaining_sessions,
          paymentStatus: s.payment_status,
          pricePerLesson: s.price_per_lesson,
          preferredFoot: s.preferred_foot,
          lessonLocation: s.lesson_location,
          eliteStatus: s.elite_status,
          paymentDate: s.payment_date,
          depositorName: s.depositor_name,
          ageCategory: s.age_category,
          inflowRoute: s.inflow_route
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

  const syncAndFetch = async (currentSession: Session) => {
    try {
      // 1. Repair/Migration: Claim any students that have NO coach_id
      // This restores data that was created before individual accounts were enforced
      const { data: orphans } = await supabase
        .from('students')
        .select('id')
        .is('coach_id', null);
      
      if (orphans && orphans.length > 0) {
        console.log(`Restoring ${orphans.length} orphaned records...`);
        // We update them ONE BY ONE if RLS is strict, but a mass update is faster if allowed
        await supabase
          .from('students')
          .update({ coach_id: currentSession.user.id })
          .is('coach_id', null);
        
        await supabase
          .from('attendance_logs')
          .update({ coach_id: currentSession.user.id })
          .is('coach_id', null);
      }

      // 2. LocalStorage Sync if needed
      const { data: cloudStudents } = await supabase
        .from('students')
        .select('id')
        .eq('coach_id', currentSession.user.id)
        .limit(1);

      const localStudents = localStorage.getItem('kickoff_students');
      if (localStudents && (!cloudStudents || cloudStudents.length === 0)) {
        const parsed: Student[] = JSON.parse(localStudents);
        if (parsed.length > 0) {
          const toUpload = parsed.map(s => ({
            coach_id: currentSession.user.id,
            name: s.name,
            contact: s.contact,
            dob: s.dob,
            position: s.position,
            goal: s.goal,
            lesson_type: s.lessonType,
            total_sessions: s.totalSessions,
            remaining_sessions: s.remainingSessions,
            payment_status: s.paymentStatus,
            team: s.team,
            price_per_lesson: s.pricePerLesson,
            preferred_foot: s.preferredFoot,
            lesson_location: s.lessonLocation,
            elite_status: s.eliteStatus || s.goal,
            payment_date: s.paymentDate,
            depositor_name: s.depositorName,
            age_category: s.ageCategory,
            inflow_route: s.inflowRoute
          }));
          await supabase.from('students').insert(toUpload);
          localStorage.removeItem('kickoff_students');
          localStorage.removeItem('kickoff_logs');
        }
      }
      await fetchData();
    } catch (err) {
      console.error('Initial sync failed:', err);
      await fetchData();
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
      elite_status: studentData.eliteStatus,
      age_category: studentData.ageCategory,
      inflow_route: studentData.inflowRoute
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
      depositor_name: updatedStudent.depositorName,
      age_category: updatedStudent.ageCategory,
      inflow_route: updatedStudent.inflowRoute
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
    const now = new Date();
    await supabase.from('attendance_logs').insert({
      student_id: studentId,
      coach_id: session.user.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
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
    const now = new Date();
    await supabase.from('attendance_logs').insert({
      student_id: studentId,
      coach_id: session.user.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      comment
    });
    fetchData();
  };

  const recordGridCheck = async (studentId: string, date: string, type: 'attendance' | 'payment', checked: boolean) => {
    if (!session) return;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (checked) {
      // 1. Add Log
      await supabase.from('attendance_logs').insert({
        student_id: studentId,
        coach_id: session.user.id,
        date,
        time: new Date().toTimeString().split(' ')[0],
        type,
        comment: type === 'attendance' ? '출석 체크' : '결제 체크'
      });

      // 2. Update remaining sessions if attendance
      if (type === 'attendance') {
        await supabase.from('students').update({
          remaining_sessions: student.remainingSessions - 1
        }).eq('id', studentId);
      }
    } else {
      // 1. Delete Log
      const logToDelete = logs.find(l => l.studentId === studentId && l.date === date && l.type === type);
      if (logToDelete) {
        await supabase.from('attendance_logs').delete().eq('id', logToDelete.id);
        
        // 2. Restore remaining sessions if attendance
        if (type === 'attendance') {
          await supabase.from('students').update({
            remaining_sessions: student.remainingSessions + 1
          }).eq('id', studentId);
        }
      }
    }
    fetchData();
  };

  return (
    <AppContext.Provider value={{ 
      students, logs, session, loading, addStudent, updateStudent, recordAttendance, updateLog, deleteLog, deleteStudent, confirmPayment, resetPayment, addComment, recordGridCheck
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
