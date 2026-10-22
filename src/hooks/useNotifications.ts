import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications } from '../lib/api';
import type { AppNotification } from '../types';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>( null);

  const load = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل الإشعارات.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) void load();
  }, [userId, load]);

  return { notifications, loading, error, reload: load };
}
