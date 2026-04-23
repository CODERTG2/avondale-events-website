"use client";

import { useMemo, useState } from "react";
import { Event } from "@/app/lib/definitions";
import { formatTimeRange } from "@/app/lib/time";
import { removePastEvents, generateEventSchedule, DaySchedule } from "../../lib/eventDisplay";
import Link from "next/link";

export default function EventList({ events }: { events: Event[] }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const upcomingEvents = useMemo(() => removePastEvents(events), [events]);
  const genres = useMemo(() => getGenres(upcomingEvents), [upcomingEvents]);

  const filteredEvents = useMemo(
    () =>
      activeGenre === "All"
        ? upcomingEvents
        : upcomingEvents.filter((event) => normalizeGenre(event.genre) === activeGenre),
    [upcomingEvents, activeGenre],
  );
  const eventSchedule = useMemo(() => generateEventSchedule(filteredEvents), [filteredEvents]);

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-5 rounded-xl border border-indigo-100 bg-white/85 p-3 shadow-sm backdrop-blur">
        <p className="text-xs text-indigo-700">Upcoming in Avondale</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-slate-900">Events Calendar</h1>
        <p className="mt-1 text-xs text-slate-600">
          Browse neighborhood events with quick venue map previews.
        </p>
      </div>
      <GenreFilterControls
        genres={genres}
        activeGenre={activeGenre}
        onSelectGenre={setActiveGenre}
        visibleCount={filteredEvents.length}
        totalCount={upcomingEvents.length}
      />
      <div className="space-y-6">
        {eventSchedule.length ? (
          eventSchedule.map((daySchedule: DaySchedule) => (
            <EventListDay daySchedule={daySchedule} key={daySchedule.dayDisplay} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-900">No events match this filter yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              Try selecting another genre to see more upcoming events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GenreFilterControls({
  genres,
  activeGenre,
  onSelectGenre,
  visibleCount,
  totalCount,
}: {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
  visibleCount: number;
  totalCount: number;
}) {
  const filterOptions = ["All", ...genres];

  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((genre) => {
          const isActive = genre === activeGenre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onSelectGenre(genre)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
              }`}
              aria-pressed={isActive}
            >
              {genre}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Showing {visibleCount} of {totalCount} upcoming events.
      </p>
    </section>
  );
}

function EventListDay({ daySchedule }: { daySchedule: DaySchedule }) {
  return (
    <section>
      <h2 className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-sm font-semibold text-indigo-800">
        {daySchedule.dayDisplay}
      </h2>
      <div className="pb-3">
        <ul className="list-none space-y-2.5 text-sm">
          {daySchedule.events.map((event: Event) => (
            <li
              key={`${event.name}-${event.startDate}-${event.organizer?.name || "unknown"}`}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <EventDisplay event={event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}



function EventDisplay({ event }: { event: Event }) {
  const timeDisplay = formatTimeRange(event);
  const locationLabel = event.venue || event.organizer?.name || "";
  const mapEmbedUrl = locationLabel
    ? `https://www.google.com/maps?q=${encodeURIComponent(locationLabel)}&output=embed`
    : undefined;
  const mapOpenUrl = locationLabel
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`
    : undefined;

  return (
    <div className="grid gap-2.5 md:grid-cols-[140px_1fr]">
      <div className="rounded-lg bg-slate-50 p-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Time</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{timeDisplay}</p>
      </div>
      <div className="min-w-0 max-w-full">
        {event.url ? (
          <Link href={event.url} className="inline-flex items-center text-base font-semibold text-slate-900 hover:text-indigo-700 hover:underline">
            <span className="break-words">{event.name}</span>
            <span className="ml-2 text-slate-500 flex items-center">
              <LinkIcon />
            </span>
          </Link>
        ) : (
          <p className="text-lg font-semibold text-slate-900 break-words">{event.name}</p>
        )}
        <div className="mt-1 text-xs text-slate-600">
          {event.organizer?.name && (
            <p className="break-words max-w-full">
              {event.organizer.name}
            </p>
          )}
        </div>
        {event.genre && (
          <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            {event.genre}
          </p>
        )}
        {mapEmbedUrl && (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <iframe
              title={`Map for ${event.name}`}
              src={mapEmbedUrl}
              loading="lazy"
              className="h-36 w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {mapOpenUrl && (
              <div className="flex justify-end bg-slate-50 px-2 py-1.5">
                <Link
                  href={mapOpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-indigo-700 hover:underline"
                >
                  <MapPinIcon />
                  <span className="ml-1">Open full map</span>
                </Link>
              </div>
            )}
          </div>
        )}
        {!mapEmbedUrl && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            No venue details available for map preview.
          </p>
        )}
      </div>
    </div>
  );
};

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 inline-block"
    >
      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 inline-block"
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351a.75.75 0 0 0 .92 0c1.622-1.288 6.79-5.874 6.79-11.101a7.25 7.25 0 1 0-14.5 0c0 5.227 5.168 9.813 6.79 11.1ZM12 14.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function normalizeGenre(genre?: string): string {
  const cleanedGenre = (genre || "").trim();
  return cleanedGenre || "Other";
}

function getGenres(events: Event[]): string[] {
  const uniqueGenres = new Set(events.map((event) => normalizeGenre(event.genre)));
  return [...uniqueGenres].sort((a, b) => a.localeCompare(b));
}
