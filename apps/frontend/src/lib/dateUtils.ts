/**
 * Return a YYYY-MM-DD string in the user's local timezone.
 *
 * Native toISOString() is UTC-based, which can mark today's local tasks as
 * yesterday/tomorrow for users outside UTC near midnight.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Parse an API date-only string as the end of that day in local time.
 */
export function localEndOfDayMs(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) {
    return Number.NaN;
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}
