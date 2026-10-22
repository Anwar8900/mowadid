export const DEFAULT_TIMEZONE = 'Asia/Riyadh';

const pad = (n: number) => String(n).padStart(2, '0');

/** Returns the UTC offset (in milliseconds) of a time zone at a given instant. */
export function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const asUTCDate = new Date(asUTC);
  return asUTCDate.getTime() - date.getTime();
}

/** Converts a `datetime-local` value (interpreted in the given time zone) to an ISO UTC string. */
export function datetimeLocalToUTC(value: string, timeZone: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), 0);
  const utcMs = wall - getTimeZoneOffsetMs(timeZone, new Date(wall)).valueOf();
  return new Date(utcMs).toISOString();
}

/** Converts an ISO UTC timestamp to a `datetime-local` value in the given time zone. */
export function utcToDatetimeLocal(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const offsetMs = getTimeZoneOffsetMs(timeZone, date).valueOf();
  const wall = new Date(date.getTime() + offsetMs);
  return `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}T${pad(
    wall.getUTCHours(),
  )}:${pad(wall.getUTCMinutes())}`;
}

/** YYYY-MM-DD in the given time zone. */
export function getDayKey(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const offsetMs = getTimeZoneOffsetMs(timeZone, date).valueOf();
  const wall = new Date(date.getTime() + offsetMs);
  return `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
}

export function isToday(iso: string, timeZone: string): boolean {
  const now = new Date();
  const offsetMs = getTimeZoneOffsetMs(timeZone, now).valueOf();
  const wall = new Date(now.getTime() + offsetMs);
  const dayKey = `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
  return getDayKey(iso, timeZone) === dayKey;
}

/** Arabic formatted date, e.g. "الخميس، 23 أكتوبر 2026". */
export function formatDate(isoOrDate: string | Date, timeZone: string): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const formatted = new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date);
  return formatted;
}

/** Arabic formatted date + time, e.g. "الخميس، 23 أكتوبر 2026، 03:30 مساءً". */
export function formatDateTime(iso: string, timeZone: string): string {
  const datePart = new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(new Date(iso));
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso));
  const hour = Number(timePart.split(':')[0]);
  const meridiem = hour < 12 ? 'صباحًا' : 'مساءً';
  return `${datePart}، ${timePart} ${meridiem}`;
}

/** Arabic formatted time only, e.g. "03:30 مساءً". */
export function formatTime(iso: string, timeZone: string): string {
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso));
  const hour = Number(timePart.split(':')[0]);
  const meridiem = hour < 12 ? 'صباحًا' : 'مساءً';
  return `${timePart} ${meridiem}`;
}
