import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://msvsocwvhpxfnfhjewar.supabase.co';
const supabaseAnonKey: string =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdnNvY3d2aHB4Zm5maGpld2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNzYwMDMsImV4cCI6MjA1OTg1MjAwM30.JU8lS8Mv6oK4OuToyCTHv6vQPNw6qiDgnCXTEPVv6Ic';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
