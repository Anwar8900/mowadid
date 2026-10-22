export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'no_show';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'upcoming',
  'completed',
  'cancelled',
  'no_show',
];

export interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_type: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  attachment_path: string | null;
  created_at: string;
  updated_at: string;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
}

export interface AppointmentInput {
  client_name: string;
  client_phone: string;
  client_email: string;
  service_type: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string;
  attachment_path?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  timezone: string;
  reminder_24h_enabled: boolean;
  reminder_1h_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'reminder_24h' | 'reminder_1h';
export type NotificationStatus = 'sent' | 'failed';

export interface AppNotification {
  id: string;
  user_id: string;
  appointment_id: string;
  type: NotificationType;
  status: NotificationStatus;
  recipient_email: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}
