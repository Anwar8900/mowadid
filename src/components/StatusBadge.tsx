import type { AppointmentStatus } from '../types';

export const STATUS_META: Record<AppointmentStatus, { label: string; className: string }> = {
  upcoming: { label: 'قادم', className: 'badge badge-upcoming' },
  completed: { label: 'مكتمل', className: 'badge badge-completed' },
  cancelled: { label: 'ملغى', className: 'badge badge-cancelled' },
  no_show: { label: 'لم يحضر', className: 'badge badge-no-show' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = STATUS_META[status];
  return <span className={meta.className}>{meta.label}</span>;
}
