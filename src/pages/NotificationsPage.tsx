import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { EmptyState } from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/States';
import { formatDateTime } from '../lib/time';
import type { NotificationType } from '../types';

const TYPE_LABELS: Record<NotificationType, string> = {
  reminder_24h: 'تذكير قبل 24 ساعة',
  reminder_1h: 'تذكير قبل ساعة',
};

export function NotificationsPage() {
  const { user, profile } = useAuth();
  const { notifications, loading, error, reload } = useNotifications(user?.id);
  const navigate = useNavigate();
  const timeZone = profile?.timezone ?? 'Asia/Riyadh';

  return (
    <div className="container page">
      <div className="page-head">
        <h1 className="page-title">مركز الإشعارات</h1>
      </div>

      <p className="hint">
        تسجَّل هنا محاولات إرسال التذكيرات بالبريد الإلكتروني: الناجحة والفاشلة، مع سبب الخطأ إن وُجد.
      </p>

      {loading ? <LoadingState message="جارٍ تحميل الإشعارات..." /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        notifications.length === 0 ? (
          <EmptyState
            title="لا توجد إشعارات"
            message="ستظهر هنا سجلات التذكيرات بعد تشغيل التذكيرات المجدولة في الخادم."
          />
        ) : (
          <div className="card-list">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className="card notification-card"
                onClick={() => navigate(`/appointments/${n.appointment_id}`)}
              >
                <div className="notification-head">
                  <span className="notification-type">{TYPE_LABELS[n.type]}</span>
                  <span className={n.status === 'sent' ? 'badge badge-completed' : 'badge badge-no-show'}>
                    {n.status === 'sent' ? 'تم الإرسال' : 'فشل الإرسال'}
                  </span>
                </div>
                <span className="notification-recipient" dir="ltr">
                  {n.recipient_email}
                </span>
                <span className="notification-date">{formatDateTime(n.created_at, timeZone)}</span>
                {n.error_message ? (
                  <span className="notification-error">{n.error_message}</span>
                ) : null}
              </button>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
