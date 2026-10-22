import { supabase } from './supabase';
import type { Appointment, AppointmentInput, AppNotification, Profile } from '../types';

const ATTACHMENTS_BUCKET = 'appointment-attachments';

function mapAppointmentError(error: unknown): Error {
  const err = error as { code?: string; message?: string };
  if (err?.code === '23P01') {
    return new Error('تعارض: يوجد موعد آخر يتعارض مع هذا الموعد في نفس الوقت.');
  }
  return new Error(err?.message ?? 'حدث خطأ غير متوقع.');
}

export async function fetchAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function fetchAppointmentById(userId: string, id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Appointment | null;
}

export async function createAppointment(
  userId: string,
  input: AppointmentInput,
): Promise<Appointment> {
  const startMs = new Date(input.start_time).getTime();
  const endMs = new Date(input.end_time).getTime();

  const { data: conflicts, error: conflictError } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, service_type')
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .lt('start_time', new Date(endMs).toISOString())
    .gt('end_time', new Date(startMs).toISOString());
  if (conflictError) throw conflictError;
  if ((conflicts ?? []).length > 0) {
    throw new Error('تعارض: يوجد موعد آخر يتعارض مع هذا الموعد في نفس الوقت.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      client_name: input.client_name.trim(),
      client_phone: input.client_phone.trim(),
      client_email: input.client_email.trim(),
      service_type: input.service_type.trim(),
      start_time: new Date(input.start_time).toISOString(),
      end_time: new Date(input.end_time).toISOString(),
      status: input.status,
      notes: input.notes.trim() ? input.notes.trim() : null,
      attachment_path: null,
    })
    .select()
    .single();
  if (error) throw mapAppointmentError(error);
  return data as Appointment;
}

export async function updateAppointment(
  userId: string,
  id: string,
  input: AppointmentInput,
): Promise<Appointment> {
  const startMs = new Date(input.start_time).getTime();
  const endMs = new Date(input.end_time).getTime();

  const { data: conflicts, error: conflictError } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, service_type')
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .neq('id', id)
    .lt('start_time', new Date(endMs).toISOString())
    .gt('end_time', new Date(startMs).toISOString());
  if (conflictError) throw conflictError;
  if ((conflicts ?? []).length > 0) {
    throw new Error('تعارض: يوجد موعد آخر يتعارض مع هذا الموعد في نفس الوقت.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_name: input.client_name.trim(),
      client_phone: input.client_phone.trim(),
      client_email: input.client_email.trim(),
      service_type: input.service_type.trim(),
      start_time: new Date(input.start_time).toISOString(),
      end_time: new Date(input.end_time).toISOString(),
      status: input.status,
      notes: input.notes.trim() ? input.notes.trim() : null,
      attachment_path: input.attachment_path ?? null,
    })
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw mapAppointmentError(error);
  return data as Appointment;
}

export async function setAppointmentStatus(userId: string, id: string, status: Appointment['status']): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'timezone' | 'reminder_24h_enabled' | 'reminder_1h_enabled'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function uploadAppointmentAttachment(
  appointmentId: string,
  file: File,
): Promise<string> {
  const path = `${appointmentId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file);
  if (error) throw error;
  const { data, error: signedError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 300);
  if (signedError) throw signedError;
  return data?.signedUrl ?? '';
}

export async function createNotificationRecord(params: {
  userId: string;
  appointmentId: string;
  type: AppNotification['type'];
  recipientEmail: string;
  status: AppNotification['status'];
  errorMessage: string | null;
  sentAt: string | null;
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    appointment_id: params.appointmentId,
    type: params.type,
    status: params.status,
    recipient_email: params.recipientEmail,
    error_message: params.errorMessage,
    sent_at: params.sentAt,
  });
  if (error) throw error;
}

export async function markReminderSent(
  appointmentId: string,
  field: 'reminder_24h_sent_at' | 'reminder_1h_sent_at',
  sentAt: string,
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ [field]: sentAt })
    .eq('id', appointmentId);
  if (error) throw error;
}
