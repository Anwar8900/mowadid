import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Paperclip, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { setAppointmentStatus, uploadAppointmentAttachment } from '../lib/api';
import { formatDateTime } from '../lib/time';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/States';
import type { AppointmentStatus } from '../types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export function AppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { appointments, loading, error, reload } = useAppointments(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timeZone = profile?.timezone ?? 'Asia/Riyadh';
  const appointment = id ? appointments.find((a) => a.id === id) ?? null : null;

  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!user || !appointment) return;
    setActionError(null);
    try {
      await setAppointmentStatus(user.id, appointment.id, status);
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'تعذر تحديث حالة الموعد.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !appointment) return;

    setUploadError(null);
    setAttachmentUrl(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('نوع الملف غير مسموح. المسموح: صور (PNG/JPG/WEBP) أو ملفات PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('حجم الملف يتجاوز الحد المسموح (5 ميجابايت).');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAppointmentAttachment(appointment.id, file);
      setAttachmentUrl(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'تعذر رفع الملف.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && !appointment) {
    return (
      <div className="container page">
        <LoadingState message="جارٍ تحميل تفاصيل الموعد..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (!appointment) {
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

  return (
    <div className="container page">
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        <ArrowRight size={16} />
        العودة إلى القائمة
      </button>

      <div className="page-head">
        <h1 className="page-title">{appointment.service_type}</h1>
        <StatusBadge status={appointment.status} />
      </div>

      <section className="card detail-card">
        <div className="detail-row">
          <span className="detail-label">العميل</span>
          <span className="detail-value" dir="auto">{appointment.client_name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">رقم الهاتف</span>
          <span className="detail-value" dir="ltr">{appointment.client_phone}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">البريد الإلكتروني</span>
          <span className="detail-value" dir="ltr">{appointment.client_email}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">نوع الخدمة / العنوان</span>
          <span className="detail-value" dir="auto">{appointment.service_type}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">البداية</span>
          <span className="detail-value">{formatDateTime(appointment.start_time, timeZone)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">النهاية</span>
          <span className="detail-value">{formatDateTime(appointment.end_time, timeZone)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">الملاحظات</span>
          <span className="detail-value" dir="auto">{appointment.notes || '—'}</span>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">تغيير الحالة</h2>
        {actionError ? <p className="form-error">{actionError}</p> : null}
        <div className="button-row">
          {appointment.status !== 'completed' ? (
            <button type="button" className="btn btn-outline" onClick={() => handleStatusChange('completed')}>
              تم إكمال الموعد
            </button>
          ) : null}
          {appointment.status !== 'no_show' ? (
            <button type="button" className="btn btn-outline" onClick={() => handleStatusChange('no_show')}>
              لم يحضر
            </button>
          ) : null}
          {appointment.status !== 'cancelled' ? (
            <button type="button" className="btn btn-danger" onClick={() => handleStatusChange('cancelled')}>
              إلغاء الموعد
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
          >
            <Pencil size={16} />
            تعديل
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">المرفقات</h2>
        <p className="hint">
          يمكنك إرفاق صورة أو ملف PDF واحد (بحد أقصى 5 ميجابايت). الملفات محفوظة بشكل خاص ولا تُشارك عبر رابط عام.
        </p>
        {uploadError ? <p className="form-error">{uploadError}</p> : null}
        <div className="button-row">
          <input
            ref={fileInputRef}
            id="attachment"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            onChange={handleFileChange}
            className="visually-hidden"
          />
          <label htmlFor="attachment" className="btn btn-outline file-label">
            <Paperclip size={16} />
            {uploading ? 'جارٍ الرفع...' : 'إرفاق ملف'}
          </label>
          {attachmentUrl ? (
            <a className="btn btn-ghost" href={attachmentUrl} target="_blank" rel="noreferrer">
              عرض الملف المرفوع
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
