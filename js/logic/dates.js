// Date helpers. Dates are local calendar days stored as 'YYYY-MM-DD' strings.
// Arithmetic runs in UTC on those strings, so daylight saving never shifts a day.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(s) {
  if (typeof s !== 'string' || !ISO_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local calendar date of a Date object. */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local date. */
export function todayISO(now = new Date()) {
  return toISODate(now);
}

function toUTC(s) {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms) {
  const t = new Date(ms);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

const DAY_MS = 86400000;

export function addDays(s, n) {
  return fromUTC(toUTC(s) + n * DAY_MS);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(s) {
  return new Date(toUTC(s)).getUTCDay();
}

/** The first day of the week containing s, for a week that starts on startDay. */
export function weekStartOf(s, startDay = 6) {
  const dow = dayOfWeek(s);
  const back = (dow - startDay + 7) % 7;
  return addDays(s, -back);
}

export function weekDates(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function compareDates(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minDate(a, b) {
  return a <= b ? a : b;
}

/** Date part of an ISO timestamp or date string, in local time for timestamps. */
export function dateOf(value) {
  if (!value) return '';
  if (isISODate(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return toISODate(d);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Sat, Nov 7" */
export function formatDate(s, { weekday = true, year = false } = {}) {
  if (!isISODate(s)) return '';
  const [y, m, d] = s.split('-').map(Number);
  let out = `${MONTHS[m - 1]} ${d}`;
  if (year) out += `, ${y}`;
  if (weekday) out = `${DAYS[dayOfWeek(s)]}, ${out}`;
  return out;
}

export function weekdayName(s, long = true) {
  return (long ? DAYS_LONG : DAYS)[dayOfWeek(s)];
}

/** "Nov 7 to 13" or "Nov 28 to Dec 4" */
export function formatRange(a, b) {
  const [, m1, d1] = a.split('-').map(Number);
  const [, m2, d2] = b.split('-').map(Number);
  if (m1 === m2) return `${MONTHS[m1 - 1]} ${d1} to ${d2}`;
  return `${MONTHS[m1 - 1]} ${d1} to ${MONTHS[m2 - 1]} ${d2}`;
}

/** Age in days of a timestamp or date relative to today (never negative). */
export function ageInDays(value, today) {
  const d = dateOf(value);
  if (!d) return 0;
  return Math.max(0, daysBetween(d, today));
}
