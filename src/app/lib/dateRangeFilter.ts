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

/** Next Fri 00:00 through following Sun 23:59:59 (local), inclusive of today if weekend. */
function getNextWeekendRange(ref: Date): { start: Date; end: Date } {
  const d = startOfDay(ref);
  const day = d.getDay(); // Fri=5 Sat=6 Sun=0
  let daysUntilFriday = (5 - day + 7) % 7;
  if (day === 5 || day === 6 || day === 0) {
    const fri = new Date(d);
    if (day === 6) fri.setDate(d.getDate() - 1);
    if (day === 0) fri.setDate(d.getDate() - 2);
    if (day === 5) fri.setTime(d.getTime());
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    return { start: startOfDay(fri), end: endOfDay(sun) };
  }
  const fri = new Date(d);
  fri.setDate(d.getDate() + daysUntilFriday);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  return { start: startOfDay(fri), end: endOfDay(sun) };
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
