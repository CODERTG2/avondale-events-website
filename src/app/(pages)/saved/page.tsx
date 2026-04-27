"use client";

import { Event } from "@/app/lib/definitions";
import { formatTimeRange, toChicago, isISODate, getDateFromISODate, eventSort } from "@/app/lib/time";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

function getEventId(event: Event) {
  return event._id;
}

function isPastEvent(event: Event): boolean {
  const now = toChicago(new Date());
  
  if (event.endDate) {
    const endStr = event.endDate as string;
    const end = isISODate(endStr) ? getDateFromISODate(endStr) : toChicago(new Date(endStr));
    if (isISODate(endStr)) end.setHours(23, 59, 59);
    return end < now;
  }
  
  const estimatedEnd = isISODate(event.startDate) ? getDateFromISODate(event.startDate) : toChicago(new Date(event.startDate));
  if (isISODate(event.startDate)) {
      estimatedEnd.setHours(23, 59, 59);
  } else {
      estimatedEnd.setHours(estimatedEnd.getHours() + 2);
  }
  return estimatedEnd < now;
}

function formatEventDate(event: Event): string {
  const date = isISODate(event.startDate) ? getDateFromISODate(event.startDate) : toChicago(new Date(event.startDate));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function SavedEventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [unlikingId, setUnlikingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSavedEvents();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchSavedEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/likes/saved");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching saved events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (eventId: string) => {
    setUnlikingId(eventId);
    try {
      const response = await fetch("/api/likes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (response.ok) {
        // Remove event from local state with animation delay
        setTimeout(() => {
          setEvents((prev) =>
            prev.filter((e) => getEventId(e) !== eventId)
          );
          setUnlikingId(null);
        }, 300);
      }
    } catch (error) {
      console.error("Error unliking event:", error);
      setUnlikingId(null);
    }
  };

  const upcomingEvents = events
    .filter((e) => !isPastEvent(e))
    .sort(eventSort);

  const pastEvents = events
    .filter((e) => isPastEvent(e))
    .sort((a, b) => eventSort(b, a));

  const displayedEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-10 h-10 text-rose-400 dark:text-rose-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            Your Saved Events
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Log in to save events you&apos;re interested in and revisit them
            anytime.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
          >
            Log In
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 ml-2"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Saved Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Events you&apos;ve liked — upcoming and past.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Upcoming
            {upcomingEvents.length > 0 && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {upcomingEvents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "past"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Past
            {pastEvents.length > 0 && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {pastEvents.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 p-5 h-24"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {activeTab === "upcoming" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-8 h-8 text-gray-400 dark:text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-8 h-8 text-gray-400 dark:text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {activeTab === "upcoming"
                ? "No upcoming saved events"
                : "No past saved events"}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              {activeTab === "upcoming"
                ? "Like events from the main page to save them here."
                : "Your liked events that have already happened will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/"
                className="inline-flex items-center mt-6 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                    clipRule="evenodd"
                  />
                </svg>
                Browse Events
              </Link>
            )}
          </div>
        )}

        {/* Event Cards */}
        {!loading && displayedEvents.length > 0 && (
          <div className="space-y-3">
            {displayedEvents.map((event) => {
              const eventId = getEventId(event);
              const past = isPastEvent(event);
              const isRemoving = unlikingId === eventId;
              const timeDisplay = formatTimeRange(event);
              const dateDisplay = formatEventDate(event);
              const locationLabel =
                event.venue || event.organizer?.name || "";
              const mapUrl = locationLabel
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`
                : undefined;

              return (
                <div
                  key={eventId}
                  className={`group relative rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 p-5 transition-all duration-300 ${
                    isRemoving
                      ? "opacity-0 scale-95 -translate-x-4"
                      : "opacity-100"
                  } ${past ? "opacity-60" : "hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"}`}
                >
                  {/* Past badge */}
                  {past && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                      Past
                    </span>
                  )}

                  {/* Date & Time pill */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                      {dateDisplay}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {timeDisplay}
                    </span>
                  </div>

                  {/* Event name */}
                  <div className="mb-2">
                    {event.url ? (
                      <Link
                        href={event.url}
                        className="text-base font-semibold text-gray-900 dark:text-white hover:underline inline-flex items-center gap-1.5"
                      >
                        {event.name}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>
                    ) : (
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {event.name}
                      </p>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {event.organizer?.name && (
                        <span>{event.organizer.name}</span>
                      )}
                      {mapUrl && (
                        <Link
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center hover:underline"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3 h-3 mr-1"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.54 22.351a.75.75 0 0 0 .92 0c1.622-1.288 6.79-5.874 6.79-11.101a7.25 7.25 0 1 0-14.5 0c0 5.227 5.168 9.813 6.79 11.1ZM12 14.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {locationLabel}
                        </Link>
                      )}
                    </div>

                    {/* Unlike button */}
                    <button
                      onClick={() => handleUnlike(eventId)}
                      disabled={isRemoving}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      aria-label="Remove from saved"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
