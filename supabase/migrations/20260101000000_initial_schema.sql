-- =====================================================================
-- مواعيدي - مخطط قاعدة البيانات الأول
-- تطبيق إدارة المواعيد (Supabase / PostgreSQL)
-- =====================================================================
-- طريقة التشغيل:
--   1) سحابي: افتح Supabase Dashboard > SQL Editor > الصق هذا الملف > Run.
--   2) محلي:  supabase db reset   (بعد supabase start)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) جدول الملف الشخصي
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  timezone text not null default 'Asia/Riyadh',
  reminder_24h_enabled boolean not null default true,
  reminder_1h_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'بيانات الملف الشخصي لكل مستخدم';

-- ---------------------------------------------------------------------
-- 2) جدول المواعيد
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_name text not null check (char_length(trim(client_name)) >= 2),
  client_phone text not null,
  client_email text not null,
  service_type text not null check (char_length(trim(service_type)) >= 2),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'completed', 'cancelled', 'no_show')),
  notes text,
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reminder_24h_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,
  constraint appointments_valid_period check (end_time > start_time)
);

comment on table public.appointments is 'مواعيد المستخدم الواحد';

-- منع تداخل المواعيد لنفس المستخدم على مستوى قاعدة البيانات
-- (خطأ التكرار عند المخالفة: 23P01 exclusion_violation)
-- ملاحظة: قيد EXCLUDE يتطلب فهرس GiST، لذلك نستخدم btree_gist لمقارنة user_id
create extension if not exists btree_gist with schema extensions;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_no_overlap'
  ) then
    alter table public.appointments
      add constraint appointments_no_overlap
      exclude using gist (user_id with =, tstzrange(start_time, end_time) with &&);
  end if;
end $$;

-- الفهارس
create index if not exists idx_appointments_user_start
  on public.appointments (user_id, start_time);
create index if not exists idx_appointments_user_status
  on public.appointments (user_id, status);

-- ---------------------------------------------------------------------
-- 3) جدول سجل الإشعارات (التذكيرات)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  type text not null check (type in ('reminder_24h', 'reminder_1h')),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  recipient_email text not null,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4) الدوال والمحفزات (Triggers)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_appointments_updated on public.appointments;
create trigger trg_appointments_updated
  before update on public.appointments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- إنشاء ملف شخصي تلقائيًا عند تسجيل أي مستخدم جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, timezone, reminder_24h_enabled, reminder_1h_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    'Asia/Riyadh',
    true,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5) Row Level Security
--    كل مستخدم يرى ويعدّل بياناته فقط.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_own" on public.appointments
  for select using (auth.uid() = user_id);

drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own" on public.appointments
  for insert with check (auth.uid() = user_id);

drop policy if exists "appointments_update_own" on public.appointments;
create policy "appointments_update_own" on public.appointments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "appointments_delete_own" on public.appointments;
create policy "appointments_delete_own" on public.appointments
  for delete using (auth.uid() = user_id);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6) التخزين: حاوية مرفقات خاصة (Private)
--    الملفات لا تُتاح عبر رابط عام إطلاقًا؛ يُستخدم رابط موقّع صادر من الواجهة.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('appointment-attachments', 'appointment-attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_select_own" on storage.objects;
create policy "attachments_select_own" on storage.objects
  for select using (bucket_id = 'appointment-attachments' and owner = auth.uid());

drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own" on storage.objects
  for insert with check (bucket_id = 'appointment-attachments' and owner = auth.uid());

drop policy if exists "attachments_update_own" on storage.objects;
create policy "attachments_update_own" on storage.objects
  for update using (bucket_id = 'appointment-attachments' and owner = auth.uid());

drop policy if exists "attachments_delete_own" on storage.objects;
create policy "attachments_delete_own" on storage.objects
  for delete using (bucket_id = 'appointment-attachments' and owner = auth.uid());
