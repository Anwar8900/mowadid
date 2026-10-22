// =====================================================================
// مواعيدي - دالة الخادم المجدولة لإرسال التذكيرات
// ---------------------------------------------------------------------
// تشغّل عبر Supabase Cron كل ساعة، ترسل تذكيرات البريد الإلكتروني
// قبل 24 ساعة وقبل ساعة من موعد العميل.
//
// متغيرات البيئة (تُضبط عبر supabase secrets set):
//   SUPABASE_URL            - رابط المشروع (متاح تلقائيًا)
//   SUPABASE_SERVICE_ROLE_KEY - مفتاح service_role (متاح تلقائيًا للوظائف)
//   RESEND_API_KEY          - مفتاح مزود البريد (Resend)
//   RESEND_FROM_EMAIL       - البريد المرسل (مثال: reminders@example.com)
//   APP_URL                 - رابط التطبيق لتضمينه في الرسالة
//   CRON_SECRET             - اختياري: سر untuk استدعاء الدالة يدويًا
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const HOUR = 60 * 60 * 1000;

interface ReminderCandidate {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  service_type: string;
  start_time: string;
  end_time: string;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  profiles: {
    timezone: string | null;
    reminder_24h_enabled: boolean | null;
    reminder_1h_enabled: boolean | null;
  } | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function formatInTimeZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('ar', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString();
  }
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from: string;
  apiKey: string;
}): Promise<{ ok: boolean; error: string | null }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (response.ok) return { ok: true, error: null };

  const body = await response.text();
  return { ok: false, error: `Resend ${response.status}: ${body.slice(0, 300)}` };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return json({ ok: false, error: 'غير مصرح بالوصول' }, 401);
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
  const appUrl = Deno.env.get('APP_URL') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير مضبوطة' }, 500);
  }
  if (!resendKey || !fromEmail) {
    return json(
      {
        ok: false,
        error: 'مزود البريد غير مُعد (RESEND_API_KEY / RESEND_FROM_EMAIL). لم يتم إرسال أي تذكير.',
        configured: false,
      },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = Date.now();
  const horizon = new Date(now + 24 * HOUR).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, user_id, client_name, client_email, service_type, start_time, end_time, reminder_24h_sent_at, reminder_1h_sent_at, profiles(timezone, reminder_24h_enabled, reminder_1h_enabled)',
    )
    .eq('status', 'upcoming')
    .gt('start_time', new Date(now).toISOString())
    .lt('start_time', horizon);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  const candidates = (data ?? []) as ReminderCandidate[];
  const summary = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] };

  for (const appointment of candidates) {
    const prefs = appointment.profiles ?? {};
    const timezone = prefs.timezone ?? 'Asia/Riyadh';
    const startMs = new Date(appointment.start_time).getTime();

    const reminders = [
      {
        type: 'reminder_24h' as const,
        leadMs: 24 * HOUR,
        enabled: prefs.reminder_24h_enabled !== false,
        sentAt: appointment.reminder_24h_sent_at,
        column: 'reminder_24h_sent_at' as const,
      },
      {
        type: 'reminder_1h' as const,
        leadMs: 1 * HOUR,
        enabled: prefs.reminder_1h_enabled !== false,
        sentAt: appointment.reminder_1h_sent_at,
        column: 'reminder_1h_sent_at' as const,
      },
    ];

    for (const reminder of reminders) {
      if (!reminder.enabled) {
        summary.skipped += 1;
        continue;
      }

      const dueAt = startMs - reminder.leadMs;
      const alreadySent = reminder.sentAt ? new Date(reminder.sentAt).getTime() >= dueAt : false;
      if (alreadySent || now < dueAt) {
        summary.skipped += 1;
        continue;
      }

      const when = formatInTimeZone(appointment.start_time, timezone);
      const label = reminder.type === 'reminder_24h' ? 'قبل 24 ساعة' : 'قبل ساعة';
      const subject = `تذكير: موعدك ${appointment.service_type} ${label}`;
      const html = `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; color:#0f172a; line-height:1.7">
          <h2 style="margin:0 0 12px">تذكير بموعدك</h2>
          <p>مرحبًا ${appointment.client_name}،</p>
          <p>هذا تذكير بموعدك: <strong>${appointment.service_type}</strong>.</p>
          <ul>
            <li>البداية: ${when}</li>
            <li>المدة: ساعتان تقريبًا</li>
          </ul>
          ${appUrl ? `<p><a href="${appUrl}">فتح التطبيق</a></p>` : ''}
          <p style="color:#64748b;font-size:13px">رسالة تذكير آلية.</p>
        </div>`;

      const result = await sendEmail({
        to: appointment.client_email,
        subject,
        html,
        from: fromEmail,
        apiKey: resendKey,
      });

      const nowIso = new Date().toISOString();

      if (result.ok) {
        summary.sent += 1;
        await supabase
          .from('appointments')
          .update({ [reminder.column]: nowIso })
          .eq('id', appointment.id);
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          appointment_id: appointment.id,
          type: reminder.type,
          status: 'sent',
          recipient_email: appointment.client_email,
          error_message: null,
          sent_at: nowIso,
        });
      } else {
        summary.failed += 1;
        const errorText = result.error ?? 'خطأ غير معروف';
        summary.errors.push(`${appointment.id}: ${errorText}`);
        await supabase.from('notifications').insert({
          user_id: appointment.user_id,
          appointment_id: appointment.id,
          type: reminder.type,
          status: 'failed',
          recipient_email: appointment.client_email,
          error_message: errorText,
          sent_at: null,
        });
      }
    }
  }

  return json({ ok: true, checked: candidates.length, ...summary });
});
