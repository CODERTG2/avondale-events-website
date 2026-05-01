import { Event } from "@/app/lib/definitions";
import { isISODate } from "@/app/lib/time";

export type DatePreset = "all" | "today" | "week" | "weekend" | "custom";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getMondayOfWeek(ref: Date): Date {
  const d = startOfDay(ref);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7; // Mon=0
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function getSundayOfWeek(ref: Date): Date {
  const mon = getMondayOfWeek(ref);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return endOfDay(sun);
}

/** Next Sat 00:00 through following Sun 23:59:59 (local), inclusive of today if weekend. */
function getNextWeekendRange(ref: Date): { start: Date; end: Date } {
  const d = startOfDay(ref);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday

  // If today is Sunday (0), the weekend started yesterday (Saturday)
  if (day === 0) {
    const sat = new Date(d);
    sat.setDate(d.getDate() - 1);
    return { start: startOfDay(sat), end: endOfDay(d) };
  }

  // Find the upcoming Saturday
  const daysUntilSaturday = (6 - day + 7) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() + daysUntilSaturday);

  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  return { start: startOfDay(sat), end: endOfDay(sun) };
}

export function getEventStartAsDate(event: Event): Date {
  if (isISODate(event.startDate)) {
    const [y, m, day] = event.startDate.split("-").map(Number);
    return new Date(y, m - 1, day, 12, 0, 0, 0);
  }
  return new Date(event.startDate);
}

export function getDatePresetRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  if (preset === "all") return null;

  if (preset === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }

  if (preset === "week") {
    return { start: getMondayOfWeek(now), end: getSundayOfWeek(now) };
  }

  if (preset === "weekend") {
    return getNextWeekendRange(now);
  }

  if (preset === "custom") {
    if (!customStart || !customEnd) return null;
    return { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) };
  }

  return null;
}
