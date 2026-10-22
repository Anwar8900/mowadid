-- =====================================================================
-- بيانات تجريبية (اختيارية) - لا تحتوي على أي معلومات شخصية حقيقية
-- ---------------------------------------------------------------------
-- الاستخدام:
--   1) سجّل حسابًا تجريبيًا من التطبيق (mowadid.demo@example.com).
--   2) انسخ معرّف المستخدم (UUID) من Supabase Dashboard > Authentication > Users.
--   3) استبدل القيمة في الأسفل بالمعرّف الحقيقي ثم شغّل هذا الملف.
--   أو: شغّل الملف كما هو أولًا لإنشاء ملف شخصي تجريبي بالمعرّف
--   00000000-0000-0000-0000-000000000000 ثم استخدم نفس المعرّف عند التسجيل.
-- =====================================================================

insert into public.profiles (id, full_name, phone, timezone, reminder_24h_enabled, reminder_1h_enabled)
values (
  '00000000-0000-0000-0000-000000000000',
  'مستخدم تجريبي',
  '0550000000',
  'Asia/Riyadh',
  true,
  true
)
on conflict (id) do update
set full_name = excluded.full_name,
    timezone = excluded.timezone;

insert into public.appointments (
  user_id, client_name, client_phone, client_email, service_type,
  start_time, end_time, status, notes
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'عميل تجريبي أول',
    '0550000001',
    'client1@example.com',
    'استشارة - فرع الرياض',
    date_trunc('day', now() + interval '1 day') + interval '10 hours',
    date_trunc('day', now() + interval '1 day') + interval '11 hours',
    'upcoming',
    'بيانات تجريبية'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'عميل تجريبي ثاني',
    '0550000002',
    'client2@example.com',
    'متابعة طلب',
    date_trunc('day', now() + interval '2 days') + interval '14 hours',
    date_trunc('day', now() + interval '2 days') + interval '15 hours',
    'upcoming',
    null
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'عميل تجريبي ثالث',
    '0550000003',
    'client3@example.com',
    'مكالمة هاتفية',
    date_trunc('day', now() - interval '1 day') + interval '09 hours',
    date_trunc('day', now() - interval '1 day') + interval '09 hours 30 minutes',
    'completed',
    'تمت المتابعة'
  );

-- ملاحظة: الموعد أعلاه مضبوط بـ offset يومي ثابت (10:00 صباحًا) وليس بساعة الآن،
-- حتى لا تتعارض مع المواعيد الفعلية للمستخدم.
