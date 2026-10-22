import { isSupabaseConfigured } from '../lib/supabase';

/**
 * حالة إعداد واضحة بدل رسائل خطأ غامضة عندما لا تكون مفاتيح Supabase موجودة.
 */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="setup-notice" role="status">
      <strong>لم يتم إعداد الاتصال بقاعدة البيانات بعد.</strong>
      <p>
        انسخ الملف <code>.env.example</code> إلى <code>.env</code> ثم أدخل{' '}
        <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> من مشروع Supabase، وأعد تشغيل
        الخادم. التفاصيل في ملف README.
      </p>
    </div>
  );
}
