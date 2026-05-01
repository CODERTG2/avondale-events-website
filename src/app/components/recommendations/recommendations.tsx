"use client";

import { Event } from "@/app/lib/definitions";
import { formatTimeRange, formatDay } from "@/app/lib/time";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type RecommendedEvent = Event & { _id?: string };

export default function Recommendations() {
  const { data: session } = useSession();
  const [recurringEvents, setRecurringEvents] = useState<RecommendedEvent[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    fetchRecommendations();
  }, [session]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [recurringRes, suggestedRes] = await Promise.all([
        fetch("/api/recommendations/recurring"),
        fetch("/api/recommendations/suggested"),
      ]);

      if (recurringRes.ok) {
        const data = await recurringRes.json();
        setRecurringEvents(data.events || []);
      }
      if (suggestedRes.ok) {
        const data = await suggestedRes.json();
        setSuggestedEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;
  if (loading) {
    return (
      <div className="w-full max-w-5xl mb-6">
        <div className="flex items-center justify-center py-6 text-sm text-slate-400 dark:text-slate-500">
          <LoadingSpinner />
          <span className="ml-2">Finding events for you…</span>
        </div>
      </div>
    );
  }
  if (recurringEvents.length === 0 && suggestedEvents.length === 0) return null;

  const hasRecurring = recurringEvents.length > 0;
  const hasSuggested = suggestedEvents.length > 0;
  const hasBoth = hasRecurring && hasSuggested;

  return (
    <div className={`w-full max-w-5xl mb-6 grid gap-4 ${hasBoth ? "md:grid-cols-2" : "grid-cols-1"}`}>
      {hasRecurring && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/40 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40">
              <RepeatIcon className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Happening Again</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 ml-8">Future dates for events you liked</p>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-60 scrollbar-thin">
            {recurringEvents.map((event, i) => (
              <RecommendationCard key={`${event.name}-${event.startDate}-${i}`} event={event} accent="emerald" />
            ))}
          </div>
        </div>
      )}
      {hasSuggested && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/40 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/40">
              <SparklesIcon className="text-violet-600 dark:text-violet-400" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recommended for You</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 ml-8">Based on events you&apos;ve liked</p>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-60 scrollbar-thin">
            {suggestedEvents.map((event, i) => (
              <RecommendationCard key={`${event.name}-${event.startDate}-${i}`} event={event} accent="violet" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ event, accent }: { event: RecommendedEvent; accent: "emerald" | "violet" }) {
  const timeDisplay = formatTimeRange(event);
  const dayDisplay = formatDay(event);
  const locationLabel = event.venue || event.organizer?.name || "";

  const accentDot = accent === "emerald"
    ? "bg-emerald-400 dark:bg-emerald-500"
    : "bg-violet-400 dark:bg-violet-500";

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-slate-100 dark:border-slate-700/40 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-2.5 transition hover:border-slate-200 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-700/50">
      {/* Accent dot */}
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${accentDot}`} />

      <div className="min-w-0 flex-1">
        {/* Name */}
        {event.url ? (
          <Link
            href={event.url}
            className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100 hover:text-indigo-700 dark:hover:text-indigo-400 hover:underline line-clamp-2 block"
          >
            {event.name}
          </Link>
        ) : (
          <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
            {event.name}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{dayDisplay}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>{timeDisplay}</span>
          {locationLabel && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="truncate">{locationLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-3.5 ${className || ""}`}
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-3.5 ${className || ""}`}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin size-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
