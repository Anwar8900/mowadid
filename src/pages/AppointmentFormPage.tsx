import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { createAppointment, updateAppointment } from '../lib/api';
import { datetimeLocalToUTC, utcToDatetimeLocal } from '../lib/time';
import { validateAppointment } from '../lib/validation';
import { APPOINTMENT_STATUSES, type AppointmentInput } from '../types';
import { STATUS_META } from '../components/StatusBadge';
import { LoadingState } from '../components/States';

function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

export function AppointmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { appointments, loading } = useAppointments(user?.id);
  const timeZone = profile?.timezone ?? 'Asia/Riyadh';

  const existing = useMemo(
    () => (id ? appointments.find((a) => a.id === id) ?? null : null),
    [appointments, id],
  );

  const [values, setValues] = useState<AppointmentInput>({
    client_name: '',
    client_phone: '',
    client_email: '',
    service_type: '',
    start_time: '',
    end_time: '',
    status: 'upcoming',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isEdit) {
      if (existing && !initialized) {
        setValues({
          client_name: existing.client_name,
          client_phone: existing.client_phone,
          client_email: existing.client_email,
          service_type: existing.service_type,
          start_time: utcToDatetimeLocal(existing.start_time, timeZone),
          end_time: utcToDatetimeLocal(existing.end_time, timeZone),
          status: existing.status,
          notes: existing.notes ?? '',
        });
        setInitialized(true);
      }
    } else if (!initialized) {
      const start = defaultStart();
      setValues((v) => ({
        ...v,
        start_time: utcToDatetimeLocal(start, timeZone),
        end_time: utcToDatetimeLocal(new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(), timeZone),
      }));
      setInitialized(true);
    }
  }, [isEdit, existing, initialized, timeZone]);

  const update = (key: keyof AppointmentInput, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !user) return;
    setError(null);

    const validationError = validateAppointment({
      ...values,
      start_time: datetimeLocalToUTC(values.start_time, timeZone),
      end_time: datetimeLocalToUTC(values.end_time, timeZone),
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: AppointmentInput = {
      ...values,
      start_time: datetimeLocalToUTC(values.start_time, timeZone),
      end_time: datetimeLocalToUTC(values.end_time, timeZone),
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateAppointment(user.id, id, payload);
      } else {
        await createAppointment(user.id, payload);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الموعد.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading && !initialized) {
    return (
      <div className="container page">
        <LoadingState message="جارٍ تحميل بيانات الموعد..." />
      </div>
    );
  }

  if (isEdit && initialized && !existing) {
    return (
      <div className="container page">
        <div className="card">
          <p className="error-message">الموعد غير موجود أو لا تملك صلاحية الوصول إليه.</p>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container page">
        <div className="card success-card">
          <div className="success-icon" aria-hidden="true">✅</div>
          <h1 className="auth-title">{isEdit ? 'تم تحديث الموعد' : 'تم حفظ الموعد'}</h1>
          <p className="auth-subtitle">
            {isEdit ? 'تم حفظ التعديلات بنجاح.' : 'تمت إضافة الموعد إلى قائمة مواعيدك.'}
          </p>
          <div className="auth-links">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
              العودة إلى الرئيسية
            </button>
            {isEdit && id ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(`/appointments/${id}`)}
              >
                عرض تفاصيل الموعد
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSuccess(false);
                  setInitialized(false);
                  setValues({
                    client_name: '',
                    client_phone: '',
                    client_email: '',
                    service_type: '',
                    start_time: '',
                    end_time: '',
                    status: 'upcoming',
                    notes: '',
                  });
                }}
              >
                إضافة موعد آخر
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1 className="page-title">{isEdit ? 'تعديل الموعد' : 'موعد جديد'}</h1>
      </div>

      <form className="card form" onSubmit={handleSubmit} dir="auto">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="client_name">اسم العميل *</label>
            <input
              id="client_name"
              type="text"
              dir="auto"
              value={values.client_name}
              onChange={(e) => update('client_name', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="client_phone">رقم الهاتف *</label>
            <input
              id="client_phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              placeholder="05xxxxxxxx"
              value={values.client_phone}
              onChange={(e) => update('client_phone', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="client_email">البريد الإلكتروني *</label>
            <input
              id="client_email"
              type="email"
              dir="ltr"
              autoComplete="off"
              value={values.client_email}
              onChange={(e) => update('client_email', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="service_type">نوع الخدمة / العنوان *</label>
            <input
              id="service_type"
              type="text"
              dir="auto"
              placeholder="مثال: استشارة - فرع الرياض"
              value={values.service_type}
              onChange={(e) => update('service_type', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="start_time">بداية الموعد *</label>
            <input
              id="start_time"
              type="datetime-local"
              value={values.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="end_time">نهاية الموعد *</label>
            <input
              id="end_time"
              type="datetime-local"
              value={values.end_time}
              onChange={(e) => update('end_time', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="status">الحالة</label>
            <select
              id="status"
              value={values.status}
              onChange={(e) => update('status', e.target.value)}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          <div className="field field-full">
            <label htmlFor="notes">ملاحظات (اختياري)</label>
            <textarea
              id="notes"
              dir="auto"
              rows={4}
              value={values.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'حفظ الموعد'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
