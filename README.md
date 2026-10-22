# مواعيدي — تطبيق إدارة المواعيد (PWA)

تطبيق ويب عربي (RTL) لإدارة المواعيد، يعمل على الجوال والحاسوب، ويمكن تثبيته على الجوال
كتطبيق (PWA) **من المتصفح** — أي عبر «إضافة إلى الشاشة الرئيسية» في Chrome / Edge / Safari.
هذا **ليس** تطبيقًا منشورًا في متاجر التطبيقات (App Store / Google Play).

---

## 1) لماذا هذه التقنيات؟

| الاختيار | السبب |
| --- | --- |
| **Vite 5** | بناء (build) سريع جدًا وخفيف، وخادم تطوير سريع، ولا يحتاج إعدادات معقدة. |
| **React 18 + TypeScript** | إطار شائع ومستقر، ونوعي يمنع أخطاء كثيرة. حجم الحزمة النهائية صغير (~120KB مضغوطة). |
| **React Router** | تنقّل بين الصفحات (تسجيل الدخول، القائمة، التفاصيل، الإعدادات). |
| **vite-plugin-pwa (Workbox)** | يولّد ملف `manifest.webmanifest` و`Service Worker` تلقائيًا من دون كتابة Service Worker يدويًا، مع تحديث تلقائي للنسخة المخزّنة. |
| **Supabase (PostgreSQL + Auth + Storage)** | قاعدة بيانات مُدارة مع مصادقة جاهزة وتخزين ملفات، وكل ذلك مع **Row Level Security** يطبّق صلاحيات المستخدم داخل قاعدة البيانات وليس في الواجهة فقط. |
| **CSS عادي (بدون Tailwind/Bootstrap)** | ملف أنماط واحد بسيط، حجم أصغر، وتحكّم كامل في اتجاه RTL. |

مبدأ التصميم: لا نخفي عناصر الواجهة كوسيلة حماية؛ كل الصلاحيات مطبّقة في قاعدة البيانات عبر سياسات RLS.

---

## 2) المزايا المنفّذة

- تسجيل حساب، تسجيل دخول بالبريد وكلمة المرور، تسجيل خروج، استعادة كلمة المرور.
- صفحة رئيسية: مواعيد اليوم + المواعيد القادمة، مع بحث وتصفية حسب التاريخ والحالة.
- إنشاء موعد وتعديله وتغيير حالته (قادم / مكتمل / ملغى / لم يحضر) مع ملاحظات اختيارية.
- بيانات العميل: الاسم، رقم الهاتف، البريد الإلكتروني، نوع الخدمة أو العنوان.
- **منع المواعيد المتداخلة** لنفس المستخدم (تحقق في الواجهة + قيد `EXCLUDE` في قاعدة البيانات).
- صفحة تفاصيل الموعد مع إرفاق ملف (صورة/PDF، بحد أقصى 5 ميجابايت) وتخزينه **بشكل خاص** مع رابط موقّع مؤقت.
- تذكيرات قبل 24 ساعة وقبل ساعة (يمكن تغييرها أو تعطيلها من الإعدادات).
- مركز إشعارات داخل التطبيق يعرض سجل إرسال التذكيرات وأخطاءها.
- إعدادات: الملف الشخصي، المنطقة الزمنية، خيارات التذكير.
- حالات واضحة: تحميل، لا توجد بيانات، أخطاء، ونجاح الحفظ.
- واجهة عربية بالكامل باتجاه RTL، ودعم النصوص المختلطة (عربي/إنجليزي) عبر `dir="auto"`.

### غير منفّذ في هذه النسخة (بوضوح)

- **رسائل SMS / WhatsApp**: غير منفّذة. تتطلب مزودًا خارجيًا وغالبًا تكون مدفوعة، وتحتاج أرقامًا ومفاتيح API.
- **إشعارات Push**: غير منفّذة. تتطلب مفاتيح VAPID وخدمة push وضبط اشتراكات، وهي تعقيد كبير على النسخة الأولى.
- **التذكيرات بالبريد** تعمل **فقط** بعد ضبط مزود بريد في الخادم (خطوات واضحة في القسم 6). بدونه لا تُرسل أي رسالة.

---

## 3) التشغيل على جهازك (محليًا)

المتطلبات: Node.js 18 أو أحدث، و[Supabase CLI](https://supabase.com/docs/guides/cli) اختياريًا.

```bash
npm install
cp .env.example .env      # على ويندوز: copy .env.example .env
```

ثم املأ في `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> المفتاح `anon` عام وقابل للنشر في المتصفح بأمان، لأن الوصول للبيانات محمي بقواعد RLS.
> **لا تضع `service_role` في الواجهة ولا في ملف `.env` الخاص بالواجهة**؛ مفتاح `service_role`
> يُستخدم داخل دالة الخادم فقط (المتغيرات `SUPABASE_SERVICE_ROLE_KEY`).

ثم:

```bash
npm run dev      # http://localhost:5173
npm run build    # بناء الإنتاج إلى مجلد dist
npm run preview  # معاينة نسخة الإنتاج
```

### إعداد Supabase

**أ) سحابي (موصى به):**

1. أنشئ مشروعًا من [supabase.com](https://supabase.com) وسجّل دخولك.
2. من **SQL Editor** الصق محتوى الملف `supabase/migrations/20260101000000_initial_schema.sql` وشغّله.
   (الملف ينشئ الجداول والفهارس وسياسات RLS وTriggers وحاوية التخزين الخاصة).
3. من **Authentication → Providers → Email** فعّل تسجيل الدخول بالبريد.
   - للتجربة السريعة: عطّل «Confirm email» حتى لا تحتاج بريدًا حقيقيًا.
   - للإنتاج: فعّل «Confirm email»، واضبط **SMTP** في Authentication (SMTP Settings) لضمان وصول رسائل التأكيد والاستعادة.
4. من **Project Settings → API** انسخ `Project URL` و`anon public key` إلى ملف `.env`.
5. تأكد من وجود حاوية `appointment-attachments` (تنشئها migration) وأنها **خاصة** (Private).

**ب) محليًا (يتطلب Docker):**

```bash
supabase start          # يشغّل قاعدة البيانات وAuth محليًا
supabase db reset       # يطبّق الترحيلات (migrations) + البيانات التجريبية
supabase status         # يعرض المنفذ والمفاتيح
```

ثم ضع في `.env` القيم التي يطبعها `supabase status` (URL و anon key الخاصين بالمشروع المحلي).

---

## 4) بنية المشروع

```
.
├── index.html                  # نقطة الدخول (lang="ar" dir="rtl")
├── vite.config.ts              # إعدادات Vite + PWA (manifest + Service Worker)
├── scripts/generate-icons.mjs  # توليد أيقونات PNG بلا اعتماديات خارجية
├── public/                     # favicon + أيقونات PWA (192, 512, maskable)
├── src/
│   ├── main.tsx                # تهيئة React + تسجيل Service Worker
│   ├── App.tsx                 # المسارات وحماية الصفحات
│   ├── index.css               # كل التنسيقات (RTL + تجاوب)
│   ├── types.ts                # الأنواع (Appointment, Profile, Notification)
│   ├── lib/
│   │   ├── supabase.ts         # عميل Supabase (مفتاح anon فقط)
│   │   ├── api.ts              # كل استعلامات البيانات + المرفقات
│   │   ├── time.ts             # التوقيت: Asia/Riyadh ⇄ UTC
│   │   └── validation.ts       # التحقق من المدخلات
│   ├── hooks/                  # useAuth, useAppointments, useNotifications
│   ├── components/             # Layout, AppointmentCard, StatusBadge, ...
│   └── pages/                  # Login, Register, ForgotPassword, Home,
│                               # AppointmentForm, AppointmentDetails, Settings, Notifications
└── supabase/
    ├── migrations/20260101000000_initial_schema.sql   # المخطط + RLS + Storage
    ├── functions/send-reminders/index.ts              # دالة التذكيرات المجدولة
    ├── seed.sql                 # بيانات تجريبية (بدون معلومات شخصية حقيقية)
    └── config.toml              # إعدادات Supabase المحلي
```

### التوقيت والمنطقة الزمنية

- قاعدة البيانات تخزّن المواعيد في `timestamptz` (UTC).
- الإدخال في الواجهة يتم عبر `datetime-local` ويُفسَّر بحسب المنطقة الزمنية من الإعدادات
  (الافتراضية `Asia/Riyadh`)، ثم يُحوَّل إلى UTC قبل الحفظ.
- العرض يتم عبر `Intl.DateTimeFormat` مع المنطقة الزمنية للمستخدم، وبصيغة عربية
  (مثال: «الخميس، 22 أكتوبر 2026، 05:25 مساءً»).

---

## 5) مخطط قاعدة البيانات وسياسات الأمان

الجداول:

- `profiles` — الملف الشخصي (الاسم، الهاتف، المنطقة الزمنية، خيارات التذكير).
  يُنشأ تلقائيًا عند التسجيل عبر Trigger على `auth.users`.
- `appointments` — المواعيد: العميل، نوع الخدمة، البداية/النهاية، الحالة، الملاحظات، مسار المرفق،
  وأعمدة `reminder_24h_sent_at` / `reminder_1h_sent_at` لمنع تكرار إرسال نفس التذكير.
- `notifications` — سجل كل محاولة إرسال تذكير (نجاح/فشل + نص الخطأ).

الصلاحيات (RLS مفعّل على كل الجداول):

```sql
-- مثال: المستخدم يرى مواعيده فقط
create policy "appointments_select_own" on public.appointments
  for select using (auth.uid() = user_id);
```

- كل جدول له سياسات `select / insert / update / delete` مقيّدة بـ `auth.uid()`.
- منع التداخل على مستوى القاعدة:
  `exclude (user_id with =, tstzrange(start_time, end_time) with &&)` — أي محاولة حجز متداخل
  تُرفض من القاعدة نفسها (خطأ `23P01`) حتى لو جداف التطبيق.
- التخزين: حاوية `appointment-attachments` **خاصة**، وسياسات `storage.objects` تسمح للمستخدم
  فقط بالوصول إلى ملفاته. التطبيق لا ينشئ روابط عامة، بل **رابطًا موقّعًا** صالحًا لـ 5 دقائق.

---

## 6) التذكيرات المجدولة (Supabase Cron + Edge Function)

الملف: `supabase/functions/send-reminders/index.ts`.

المزود المستخدم في هذه النسخة هو **Resend** (بريد فقط). يمكن استبداله بمزود آخر بتعديل دالة
`sendEmail` في الملف.

**خطوات الإعداد:**

```bash
# 1) نشر الدالة
supabase functions deploy send-reminders --no-verify-jwt

# 2) ضبط المتغيرات السرّية (لا تُكتب في ملفات الواجهة)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=reminders@yourdomain.com
supabase secrets set APP_URL=https://your-app-url.com
supabase secrets set CRON_SECRET=ضع_سرًا_عشوائيًا_طويلًا

# 3) جدولة التنفيذ كل ساعة
supabase functions schedule send-reminders --cron "0 * * * *"
```

> بديل بدون CLI: من لوحة Supabase → **Edge Functions → send-reminders → Cron** أضف الجدولة،
> ثم **Integrations → Cron** أو الاستدعاء من Job خارجي.

**كيف يمنع الإرسال المكرر؟**

- لكل موعد عمودان: `reminder_24h_sent_at` و`reminder_1h_sent_at`.
- عند الاستحقاق (بداية نافذة التذكير) تتحقق الدالة: هل الوقت الحالي ضمن نافذة التذكير؟
  وهل لم يُرسل هذا التذكير من قبل لهذا الموعد؟ إن كان أُرسل فلا يُعاد.
- كل محاولة (نجاح/فشل) تُسجَّل في `notifications` مع `sent_at` أو `error_message`،
  وتظهر في «مركز الإشعارات» داخل التطبيق.
- عند فشل الإرسال **لا** يُحدَّث عمود «أُرسل»، sehingga تُعاد المحاولة في التشغيل التالي.

**تشغيل يدوي للاختبار:**

```bash
supabase functions invoke send-reminders --no-verify-jwt \
  --header "Authorization: Bearer <CRON_SECRET>"
```

بدون ضبط `RESEND_API_KEY` ستعيد الدالة رسالة واضحة
`مزود البريد غير مُعد ... لم يتم إرسال أي تذكير` بدل الادعاء بأن البريد يعمل.

---

## 7) التثبيت على الجوال (PWA)

- `manifest.webmanifest` (+ `dist/manifest.webmanifest` بعد البناء) يعرّف الاسم العربي،
  `dir: rtl`، `lang: ar`، اللون، والأيقونات (192، 512، ونسخة maskable).
- `Service Worker` (Workbox) يخزّن ملفات التطبيق للعمل دون اتصال، ويحدّثها تلقائيًا.
- **للتثبيت:**
  - Chrome/Edge على Android: افتح الموقع ← قائمة المتصفح ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
  - Chrome على Windows: أيقونة التثبيت في شريط العنوان ← «تثبيت».
  - Safari على iPhone: زر المشاركة ← «إضافة إلى الشاشة الرئيسية».
- **مهم:** هذا تثبيت من المتصفح (Web App / PWA)، وليس نشرًا في App Store أو Google Play،
  ولا يحتاج إلى متجر تطبيقات أو مراجعة من Apple أو Google.
- يجب أن يكون الموقع يعمل عبر **HTTPS** (أو `localhost`) حتى يعمل Service Worker والتثبيت.
  عند النشر على Netlify/Vercel/Cloudflare Pages يكون ذلك تلقائيًا.

---

## 8) النشر

المشروع ملفات ثابتة بعد `npm run build` (المخرج في `dist/`). يمكن نشره على:

- **Netlify / Vercel / Cloudflare Pages**: اربط المستودع، أمر البناء `npm run build`،
  ومجلد النشر `dist`. أضف متغيرات البيئة `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` في إعدادات الموقع.
- **GitHub Pages**: أضف خطوة بناء في/workflows؛ انتبه أن المسارات الأساسية (base) تحتاج
  `base: '/اسم-المستودع/'` في `vite.config.ts` و`base` في `vite.config`، وقاعدة البيانات تبقى كما هي.

---

## 9) النسخ الاحتياطي وتصدير قاعدة البيانات

> **تنبيه مهم:** حتى في الخطط المجانية من Supabase لا يمكنك الاعتماد على نسخ احتياطي تلقائي
> مناسب أو طويل الأمد. عامل النسخ الاحتياطي كمسؤوليتك أنت.

- **تصدير يدوي (متاح في كل الخطط):** Dashboard → **Database → Backups** أو
  **Settings → Database → Export** لتنزيل نسخة `.sql`، أو عبر CLI:

```bash
supabase db dump --file backup-$(date +%F).sql          # للبيانات
supabase db dump --data-only --file data-$(date +%F).sql # البيانات فقط
```

- **النسخ التلقائي:** فعّل **Point-in-Time Recovery (PITR)** من إعدادات المشروع (متاح في
  الخطط المدفوعة) فهو يوفّر استرجاعًا زمنيًا. على الخطة المجانية نفّذ نسخة dump دورية
  بنفسك (مهمة Windows/Linux مجدولة) وانسخ الملف إلى تخزين خارجي (Google Drive، S3، …).
- **خطة مقترحة:** نسخة يومية `db dump` + نسخة أسبوعية كاملة + تخزين خارج المشروع.
- **لا تشغّل `supabase db reset` على مشروع سحابي**، فهو يمسح البيانات ويعيد تطبيق الترحيلات.

---

## 10) بيانات تجريبية (اختيارية)

الملف `supabase/seed.sql` يحتوي بيانات وهمية بالكامل (أسماء «عميل تجريبي أول» وبريد
`example.com`).To استخدمها:

1. شغّل ملف `supabase/seed.sql` في SQL Editor (ينشئ ملفًا شخصيًا بالمعرّف
   `00000000-0000-0000-0000-000000000000` وثلاثة مواعيد تجريبية).
2. سجّل حسابًا في التطبيق، ثم انسخ معرّف المستخدم من
   **Authentication → Users** واستبدل `user_id` في ملف الـ seed بمعرّفك (أو غيّر
   `user_id` داخل الأسطر إلى معرّفك).

> كل البيانات وهمية ولا تحتوي على أي معلومات شخصية حقيقية.

---

## 11) ملخص إعداد سريع

```bash
npm install
cp .env.example .env          # املأ رابط المشروع والمفتاح العام
npm run dev                   # للتطوير
npm run build && npm run preview
```

ثم في Supabase:

1. تشغيل `supabase/migrations/20260101000000_initial_schema.sql`.
2. تفعيل المصادقة بالبريد.
3. (اختياري) نشر `send-reminders` وضبط أسرار البريد والجدولة.

---

## 12) ملاحظات أمنية

- لا توجد أي مفاتيح سرّية داخل `src/` أو ملفات الواجهة؛ الواجهة تستخدم المفتاح العام فقط.
- `service_role` يُستخدم داخل دالة الخادم فقط ولا يصل للمتصفح.
- التحقق من المدخلات يتم في الواجهة **و** في قاعدة البيانات (قيود `check`).
- الملفات المرفوعة: نوع محدود (PNG/JPG/WEBP/PDF)، حجم محدود (5 ميجابايت)، حاوية خاصة،
  وروابط موقّتة قصيرة الصلاحية.
- الصلاحيات مطبّقة عبر RLS؛ إخفاء عناصر الواجهة ليس وسيلة حماية.

## 13) الترخيص

مشروع تعليمي/قابل للاستخدام الشخصي. أضف ترخيصًا يناسبك (MIT مثلًا) إن أردت نشره.
