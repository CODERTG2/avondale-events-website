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

  // Don't render anything if not logged in or no recommendations
  if (!session) return null;
  if (loading) {
    return (
      <div className="w-full mb-10">
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-gray-500">
          <LoadingSpinner />
          <span className="ml-2">Finding events for you…</span>
        </div>
      </div>
    );
  }
  if (recurringEvents.length === 0 && suggestedEvents.length === 0) return null;

  return (
    <div className="w-full mb-10">
      {recurringEvents.length > 0 && (
        <RecommendationSection
          title="Happening Again"
          subtitle="Future dates for events you liked"
          icon={<RepeatIcon />}
          events={recurringEvents}
          accentColor="emerald"
        />
      )}
      {suggestedEvents.length > 0 && (
        <RecommendationSection
          title="Recommended for You"
          subtitle="Based on events you've liked"
          icon={<SparklesIcon />}
          events={suggestedEvents}
          accentColor="violet"
        />
      )}
    </div>
  );
}

function RecommendationSection({
  title,
  subtitle,
  icon,
  events,
  accentColor,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  events: RecommendedEvent[];
  accentColor: "emerald" | "violet";
}) {
  const borderClass =
    accentColor === "emerald"
      ? "border-emerald-500/30 dark:border-emerald-400/20"
      : "border-violet-500/30 dark:border-violet-400/20";
  const bgClass =
    accentColor === "emerald"
      ? "bg-emerald-50/50 dark:bg-emerald-950/20"
      : "bg-violet-50/50 dark:bg-violet-950/20";
  const iconColor =
    accentColor === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-violet-600 dark:text-violet-400";
  const subtitleColor =
    accentColor === "emerald"
      ? "text-emerald-600/70 dark:text-emerald-400/50"
      : "text-violet-600/70 dark:text-violet-400/50";

  return (
    <div
      className={`rounded-xl border ${borderClass} ${bgClass} p-5 mb-6 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColor}>{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className={`text-xs ${subtitleColor} mb-4`}>{subtitle}</p>

      {/* Event cards - horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {events.map((event, i) => (
          <RecommendationCard key={`${event.name}-${event.startDate}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ event }: { event: RecommendedEvent }) {
  const timeDisplay = formatTimeRange(event);
  const dayDisplay = formatDay(event);
  const locationLabel = event.venue || event.organizer?.name || "";

  return (
    <div className="flex-shrink-0 w-56 snap-start rounded-lg bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-all duration-200 dark:hover:bg-gray-700/80 dark:hover:border-gray-600/50">
      {/* Date chip */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        {dayDisplay}
      </div>

      {/* Event name */}
      {event.url ? (
        <Link
          href={event.url}
          className="text-sm font-semibold leading-tight hover:underline line-clamp-2 block mb-1"
        >
          {event.name}
        </Link>
      ) : (
        <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1">
          {event.name}
        </p>
      )}

      {/* Time */}
      <p className="text-xs text-gray-500 dark:text-gray-400">{timeDisplay}</p>

      {/* Organizer / Location */}
      {locationLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
          {locationLabel}
        </p>
      )}
    </div>
  );
}

/* ── Icons ── */

function RepeatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
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
