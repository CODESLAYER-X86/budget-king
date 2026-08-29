/**
 * Format dates in Dhaka timezone (UTC+6)
 */

const DHAKA_TZ = "Asia/Dhaka";

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-BD", {
    timeZone: DHAKA_TZ,
    ...opts,
  });
}

export function formatDateTime(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-BD", {
    timeZone: DHAKA_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-BD", {
    timeZone: DHAKA_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}
