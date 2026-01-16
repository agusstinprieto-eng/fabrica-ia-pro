
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgtlvubklycovcflnuxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndGx2dWJrbHljb3ZjZmxudXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTA2NDEsImV4cCI6MjA4NDE2NjY0MX0.hqkYl9Dw06ZpoKrWQcgtyR_MgeADwGyCM0EZTHA1aC0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
