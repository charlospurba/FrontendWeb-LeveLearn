import { createClient } from '@supabase/supabase-js'

// 1. Ambil dari 'Project URL' di dashboard
const supabaseUrl = 'https://hfuwatcoqcitqykvrtbp.supabase.co' 

// 2. Ambil dari 'anon public key' di dashboard
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXdhdGNvcWNpdHF5a3ZydGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDYyODEsImV4cCI6MjA4MTgyMjI4MX0.JGgZorny4tj7Zo5G7KfuA30dwpX3F5iL3tvLeJIeW4c' 

export const supabase = createClient(supabaseUrl, supabaseKey)