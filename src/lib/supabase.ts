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

/**
 * عند عدم ضبط المفاتيح نستخدم عنوانًا غير صالح عمدًا (وليس عنوانًا محليًا حقيقيًا)
 * حتى لا يرسل التطبيق أي طلب إلى جهاز المستخدم بالخطأ. الواجهة تعرض SetupNotice
 * وتوقف العمليات حينها.
 */
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://not-configured.invalid',
  isSupabaseConfigured ? anonKey : 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
