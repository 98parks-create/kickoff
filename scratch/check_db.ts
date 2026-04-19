
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const { data: students, error } = await supabase.from('students').select('*');
  if (error) {
    console.error('Error fetching students:', error);
    return;
  }
  console.log('Total students in DB:', students.length);
  console.log('Coach IDs present:', [...new Set(students.map(s => s.coach_id))]);
  
  const { data: logs } = await supabase.from('attendance_logs').select('*');
  console.log('Total logs in DB:', logs.length);
}

checkData();
