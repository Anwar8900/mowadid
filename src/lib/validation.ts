export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPhone = (value: string): boolean =>
  /^\+?[0-9\s\-()]{6,20}$/.test(value.trim());

export const isValidPassword = (value: string): boolean => value.length >= 6;

export interface AppointmentFormValues {
  client_name: string;
  client_phone: string;
  client_email: string;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}

export function validateAppointment(values: AppointmentFormValues): string | null {
  const clientName = values.client_name.trim();
  const clientPhone = values.client_phone.trim();
  const clientEmail = values.client_email.trim();
  const serviceType = values.service_type.trim();

  if (clientName.length < 2) return 'يرجى إدخال اسم العميل (مفتاحين على الأقل).';
  if (!isValidPhone(clientPhone)) return 'يرجى إدخال رقم هاتف صحيح للعميل.';
  if (!isValidEmail(clientEmail)) return 'يرجى إدخال بريد إلكتروني صحيح للعميل.';
  if (serviceType.length < 2) return 'يرجى إدخال نوع الخدمة.';

  const startMs = new Date(values.start_time).getTime();
  const endMs = new Date(values.end_time).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 'يرجى تحديد تاريخ ووقت البداية والنهاية.';
  if (endMs <= startMs) return 'يجب أن يكون وقت النهاية بعد وقت البداية.';

  if (values.notes && values.notes.trim().length > 1000) {
    return 'الملاحظات يجب ألا تتجاوز 1000 حرف.';
  }

  return null;
}
