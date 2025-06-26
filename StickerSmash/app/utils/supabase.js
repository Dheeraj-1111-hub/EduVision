import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nxinycotkavrfvrdzsut.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aW55Y290a2F2cmZ2cmR6c3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTg2NDcsImV4cCI6MjA1OTE3NDY0N30.aURT63W4VwGoGh6Zhn87pxrJCBQSA-XIpJ73iEjLpUk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
