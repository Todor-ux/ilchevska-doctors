// ====================================================
// КОНФИГУРАЦИЯ – попълнете след настройка на Supabase
// ====================================================

const SUPABASE_URL  = 'https://ikyrlgrmbboesgcpwbhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlr>eXJsZ3JtYmJvZXNnY3B3YmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MTYyMjMsImV4cCI6MjA1ODk5MjIyM30.placeholder';

// EmailJS
const EMAILJS_PUBLIC_KEY       = 'ez5Sq5tyq4SOohyKl';
const EMAILJS_SERVICE_ID       = 'service_6cnat9p';
const EMAILJS_DOCTOR_TEMPLATE  = 'template_kxoq21h';
const EMAILJS_PATIENT_TEMPLATE = 'template_w7rpgho';

// Admin
const ADMIN_EMAIL   = 'karaivanovtodor668@gmail.com';

// Аптека
const PHARMACY_NAME  = 'Ilchevska Pharmacy';
const PHARMACY_PHONE = '0301 808 36';
const PHARMACY_ADDR  = 'ул. Тракия 18, кв. Устово, Смолян';

// Supabase клиент (зарежда се след supabase CDN script)
function initSupabase() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
