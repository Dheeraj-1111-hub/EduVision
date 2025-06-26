import { createClient } from '@supabase/supabase-js';

// 🔥 Replace with your Supabase Project URL and Anon Key
const SUPABASE_URL = "https://sghwatufechoxkoyuokr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaHdhdHVmZWNob3hrb3l1b2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjYxNDksImV4cCI6MjA1ODkwMjE0OX0.eO-JEq9Qg8nvUjNaZtStwktZVFdyYC4oYS7AlRG1Qzw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
