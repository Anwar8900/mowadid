import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentCard } from '../components/AppointmentCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState, LoadingState } from '../components/States';
import { formatDate, getDayKey } from '../lib/time';
import type { AppointmentStatus } from '../types';

type StatusFilter = 'all' | AppointmentStatus;

export function HomePage() {
  const { user, profile } = useAuth();
  const { appointments, loading, error, reload } = useAppointments(user?.id);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState('');

  const timeZone = profile?.timezone ?? 'Asia/Riyadh';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (a.status === 'cancelled' && statusFilter === 'all') return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (dateFilter && getDayKey(a.start_time, timeZone) !== dateFilter) return false;
      if (!q) return true;
      return (
        a.client_name.toLowerCase().includes(q) ||
        a.service_type.toLowerCase().includes(q) ||
        a.client_email.toLowerCase().includes(q) ||
        a.client_phone.toLowerCase().includes(q)
      );
    });
  }, [appointments, query, statusFilter, dateFilter, timeZone]);

  const todayKey = getDayKey(new Date().toISOString(), timeZone);
  const nowMs = Date.now();

  const todayAppointments = filtered.filter(
    (a) => getDayKey(a.start_time, timeZone) === todayKey && a.status !== 'cancelled',
  );
  const upcomingAppointments = filtered
    .filter((a) => a.status === 'upcoming' && new Date(a.start_time).getTime() >= nowMs)
    .filter((a) => getDayKey(a.start_time, timeZone) !== todayKey);

  const hasFilters = Boolean(query.trim()) || statusFilter !== 'all' || Boolean(dateFilter);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1 className="page-title">مواعيدي</h1>
          <p className="page-subtitle">{formatDate(new Date(), timeZone)}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/appointments/new')}
        >
          <Plus size={18} />
          موعد جديد
        </button>
      </div>

      <section className="card filters" aria-label="بحث وتصفية">
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            dir="auto"
            placeholder="ابحث بالاسم أو الخدمة أو البريد..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث"
          />
        </div>
        <div className="filter-row">
          <div className="field">
            <label htmlFor="statusFilter">الحالة</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">كل الحالات</option>
              <option value="upcoming">قادم</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغى</option>
              <option value="no_show">لم يحضر</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dateFilter">التاريخ</label>
            <input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              مسح التصفية
            </button>
          ) : null}
        </div>
      </section>

      {loading ? <LoadingState message="جارٍ تحميل المواعيد..." /> : null}

      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <>
          <section className="section">
            <h2 className="section-title">مواعيد اليوم ({todayAppointments.length})</h2>
            {todayAppointments.length === 0 ? (
              <EmptyState title="لا توجد مواعيد اليوم" message="أضف موعدًا جديدًا أو غيّر عوامل التصفية." />
            ) : (
              <div className="card-list">
                {todayAppointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onOpen={(id) => navigate(`/appointments/${id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <h2 className="section-title">المواعيد القادمة ({upcomingAppointments.length})</h2>
            {upcomingAppointments.length === 0 ? (
              <EmptyState
                title="لا توجد مواعيد قادمة"
                message="كل مواعيدك القادمة لا تزال في يوم اليوم أو أوقفت."
              />
            ) : (
              <div className="card-list">
                {upcomingAppointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onOpen={(id) => navigate(`/appointments/${id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
