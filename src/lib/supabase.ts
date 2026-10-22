import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/**
 * هل تم إعداد مفاتيح Supabase في ملف .env؟
 * المفتاح العام (anon) آمن للنشر في المتصفح لأن الصلاحيات مفعّلة على مستوى قاعدة البيانات (RLS).
 */
export const isSupabaseConfigured =
  url.length > 0 &&
  anonKey.length > 0 &&
  !url.includes('your-project-ref') &&
  !anonKey.includes('your-anon-key');

export const supabase = createClient(
  isSupabaseConfigured ? url : 'http://127.0.0.1:54321',
  isSupabaseConfigured ? anonKey : 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
