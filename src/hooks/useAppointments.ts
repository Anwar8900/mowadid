import { useCallback, useEffect, useState } from 'react';
import { fetchAppointments } from '../lib/api';
import type { Appointment } from '../types';

export function useAppointments(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppointments(userId);
      setAppointments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل المواعيد.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  return { appointments, loading, error, reload: load };
}
