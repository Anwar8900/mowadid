-- =====================================================================
-- بيانات تجريبية (اختيارية) - لا تحتوي على أي معلومات شخصية حقيقية
-- ---------------------------------------------------------------------
-- الاستخدام:
--   1) أنشئ حسابًا تجريبيًا من التطبيق (أو من Authentication → Users).
--   2) انسخ معرّف المستخدم (UUID) من Supabase Dashboard > Authentication > Users.
--   3) استبدل '00000000-0000-0000-0000-000000000000' في الأسفل بمعرّفك
--      ثم شغّل هذا الملف من SQL Editor.
--
-- ملاحظة: يمرّر هذا الملف عبر محفّز إنشاء الملف الشخصي (on_auth_user_created)،
-- لذلك لو كان المستخدم قد أُنشئ قبل تطبيق الترحيلات يلزم inserts يدوي للـ profile.
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

-- ملاحظة: المواعيد أعلاه مثبتة بساعة ثابتة (10:00 صباحًا) لا بساعة الآن،
-- حتى لا تتعارض مع المواعيد الفعلية للمستخدم.
-- لتفعيلها على حسابك: استبدل كل معرّفات المستخدم أعلاه بمعرّفك ثم أعد التشغيل.
