import type { Appointment } from '../types';
import { formatDateTime, formatTime, getDayKey } from '../lib/time';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge } from './StatusBadge';

interface Props {
  appointment: Appointment;
  onOpen: (id: string) => void;
}

export function AppointmentCard({ appointment, onOpen }: Props) {
  const { profile } = useAuth();
  const timeZone = profile?.timezone ?? 'Asia/Riyadh';

  const isToday = getDayKey(appointment.start_time, timeZone) === getDayKey(new Date().toISOString(), timeZone);

  return (
    <button type="button" className="appointment-card" onClick={() => onOpen(appointment.id)}>
      <div className="appointment-time">
        <span className="appointment-time-main">{formatTime(appointment.start_time, timeZone)}</span>
        <span className="appointment-time-sub">حتى {formatTime(appointment.end_time, timeZone)}</span>
      </div>
      <div className="appointment-info">
        <span className="appointment-client" dir="auto">
          {appointment.client_name}
        </span>
        <span className="appointment-service" dir="auto">
          {appointment.service_type}
        </span>
        {appointment.notes ? (
          <span className="appointment-notes" dir="auto">
            {appointment.notes}
          </span>
        ) : null}
      </div>
      <div className="appointment-meta">
        <span className="appointment-date">
          {isToday ? 'اليوم - ' : ''}
          {formatDateTime(appointment.start_time, timeZone)}
        </span>
        <StatusBadge status={appointment.status} />
      </div>
    </button>
  );
}
