const SUPABASE_URL = 'https://ikyrlgrmbboesgcpwbhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreXJsZ3JtYmJvZXNnY3B3YmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTEwNDYsImV4cCI6MjA5MDQ2NzA0Nn0.lrHNqxuTYdGeRTG6iqPTA5waZelVBOH4o-_pZ7wY4A0';

const EMAILJS_PUBLIC_KEY = 'ez5Sq5tyq4SOohyKl';
const EMAILJS_SERVICE_ID = 'service_6cnat9p';
const EMAILJS_DOCTOR_TEMPLATE = 'template_kxoq21h';
const EMAILJS_PATIENT_TEMPLATE = 'template_w7rpgho';

const ADMIN_EMAIL = 'karaivanovtodor668@gmail.com';
const PHARMACY_NAME = 'Ilchevska Pharmacy';
const PHARMACY_PHONE = '0301 808 36';
const PHARMACY_ADDR = 'ul. Trakia 18, kv. Ustovo, Smolyan';

function initSupabase() {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
