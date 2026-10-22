import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../lib/api';
import { DEFAULT_TIMEZONE } from '../lib/time';
import { isValidPhone } from '../lib/validation';

const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'الرياض (UTC+3)' },
  { value: 'Asia/Dubai', label: 'دبي (UTC+4)' },
  { value: 'Asia/Kuwait', label: 'الكويت (UTC+3)' },
  { value: 'Asia/Qatar', label: 'الدوحة (UTC+3)' },
  { value: 'Africa/Cairo', label: 'القاهرة (UTC+2)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'لندن (UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'برلين (UTC+1/+2)' },
  { value: 'Europe/Istanbul', label: 'إسطنبول (UTC+3)' },
  { value: 'America/New_York', label: 'نيويورك (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'شيكاغو (UTC-6/-5)' },
  { value: 'America/Los_Angeles', label: 'لوس أنجلوس (UTC-8/-7)' },
];

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile && !loaded) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setTimezone(profile.timezone ?? DEFAULT_TIMEZONE);
      setReminder24h(profile.reminder_24h_enabled);
      setReminder1h(profile.reminder_1h_enabled);
      setLoaded(true);
    }
  }, [profile, loaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setError(null);
    setMessage(null);

    if (fullName.trim().length < 2) {
      setError('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setError('رقم الهاتف غير صحيح.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        timezone,
        reminder_24h_enabled: reminder24h,
        reminder_1h_enabled: reminder1h,
      });
      await refreshProfile();
      setMessage('تم حفظ الإعدادات بنجاح.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <h1 className="page-title">الإعدادات</h1>
      </div>

      <form className="card form" onSubmit={handleSubmit} dir="auto">
        <h2 className="section-title">الملف الشخصي</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullName">الاسم الكامل</label>
            <input
              id="fullName"
              type="text"
              dir="auto"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">رقم الهاتف (اختياري)</label>
            <input
              id="phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email-readonly">البريد الإلكتروني</label>
            <input id="email-readonly" type="email" dir="ltr" value={user?.email ?? ''} readOnly />
          </div>
        </div>

        <h2 className="section-title">المنطقة الزمنية</h2>
        <div className="form-grid">
          <div className="field field-full">
            <label htmlFor="timezone">المنطقة الزمنية المستخدمة لعرض المواعيد</label>
            <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <span className="hint">
              تُحفظ المواعيد في قاعدة البيانات بتوقيت UTC وتُعرض حسب هذه المنطقة. الافتراضي: توقيت الرياض.
            </span>
          </div>
        </div>

        <h2 className="section-title">خيارات التذكير</h2>
        <p className="hint">
          التذكيرات تُرسل بالبريد الإلكتروني إلى بريد العميل قبل الموعد. يتطلب تشغيلها ضبط مزود بريد في
          دالة الخادم (انظر ملف README).
        </p>
        <div className="toggle-list">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={reminder24h}
              onChange={(e) => setReminder24h(e.target.checked)}
            />
            <span>تذكير قبل 24 ساعة</span>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={reminder1h}
              onChange={(e) => setReminder1h(e.target.checked)}
            />
            <span>تذكير قبل ساعة</span>
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}
