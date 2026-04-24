"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Event } from "@/app/lib/definitions";
import { formatTimeRange, eventSort } from "@/app/lib/time";
import { removePastEvents, generateEventSchedule, DaySchedule } from "../../lib/eventDisplay";
import Link from "next/link";
import {
  CANONICAL_GENRE_TAGS,
  CanonicalGenre,
  getCanonicalGenreForEvent,
  getGenrePresentation,
} from "@/app/lib/genreTags";
import { DatePreset, isEventInDatePreset } from "@/app/lib/dateRangeFilter";
import { geocodeWithNominatim, haversineKm } from "@/app/lib/geo";

export default function EventList({ events }: { events: Event[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<CanonicalGenre[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [coordByLabel, setCoordByLabel] = useState<Record<string, { lat: number; lng: number } | null>>({});

  const upcomingEvents = useMemo(() => removePastEvents(events), [events]);

  const filteredEvents = useMemo(() => {
    let list = upcomingEvents;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((event) => {
        const name = event.name.toLowerCase();
        const org = (event.organizer?.name || "").toLowerCase();
        return name.includes(q) || org.includes(q);
      });
    }
    list = list.filter((event) =>
      isEventInDatePreset(event, datePreset, customStart, customEnd),
    );
    if (selectedGenres.length > 0) {
      const set = new Set(selectedGenres);
      list = list.filter((event) => set.has(getCanonicalGenreForEvent(event)));
    }
    return list;
  }, [upcomingEvents, searchQuery, datePreset, customStart, customEnd, selectedGenres]);

  const sortedEvents = useMemo(() => {
    const copy = [...filteredEvents];
    if (!nearMeEnabled || !userPos) {
      copy.sort(eventSort);
      return copy;
    }
    const distFor = (event: Event): number | null => {
      if (event.latitude != null && event.longitude != null) {
        return haversineKm(userPos.lat, userPos.lng, event.latitude, event.longitude);
      }
      const label = (event.venue || event.organizer?.name || "").trim();
      if (!label) return null;
      const c = coordByLabel[label];
      if (!c) return null;
      return haversineKm(userPos.lat, userPos.lng, c.lat, c.lng);
    };
    copy.sort((a, b) => {
      const da = distFor(a);
      const db = distFor(b);
      if (da != null && db != null && da !== db) return da - db;
      if (da != null && db == null) return -1;
      if (da == null && db != null) return 1;
      return eventSort(a, b);
    });
    return copy;
  }, [filteredEvents, nearMeEnabled, userPos, coordByLabel]);

  const eventSchedule = useMemo(
    () => generateEventSchedule(sortedEvents),
    [sortedEvents],
  );

  const labelsToGeocode = useMemo(() => {
    if (!nearMeEnabled || !userPos) return [];
    const labels = new Set<string>();
    for (const event of filteredEvents) {
      if (event.latitude != null && event.longitude != null) continue;
      const label = (event.venue || event.organizer?.name || "").trim();
      if (!label) continue;
      if (coordByLabel[label] !== undefined) continue;
      labels.add(label);
    }
    return [...labels];
  }, [nearMeEnabled, userPos, filteredEvents, coordByLabel]);

  const geoRequestedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!nearMeEnabled || !userPos || labelsToGeocode.length === 0) return;
    let cancelled = false;

    const run = async () => {
      for (const label of labelsToGeocode) {
        if (cancelled) break;
        if (geoRequestedRef.current.has(label)) continue;
        geoRequestedRef.current.add(label);
        await new Promise((r) => setTimeout(r, 1100));
        if (cancelled) break;
        const query = `${label}, Avondale, Chicago, IL, USA`;
        try {
          const coords = await geocodeWithNominatim(query);
          if (!cancelled) {
            setCoordByLabel((prev) => ({ ...prev, [label]: coords }));
          }
        } catch {
          if (!cancelled) {
            setCoordByLabel((prev) => ({ ...prev, [label]: null }));
          }
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [nearMeEnabled, userPos, labelsToGeocode]);

  useEffect(() => {
    if (!nearMeEnabled) {
      geoRequestedRef.current = new Set();
    }
  }, [nearMeEnabled]);

  const requestNearMe = () => {
    if (nearMeEnabled) {
      setNearMeEnabled(false);
      setGeoHint(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoHint("Location is not supported in this browser.");
      return;
    }
    setGeoHint(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeEnabled(true);
      },
      () => {
        setGeoHint("Could not read your location. Check browser permissions.");
        setNearMeEnabled(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  const toggleGenre = (g: CanonicalGenre) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const clearGenres = () => setSelectedGenres([]);

  return (
    <div className="w-full max-w-5xl">
      <p className="mb-3 text-xs text-slate-600">
        Browse neighborhood events with quick venue map previews.
      </p>

      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        datePreset={datePreset}
        onDatePreset={setDatePreset}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStart={setCustomStart}
        onCustomEnd={setCustomEnd}
        selectedGenres={selectedGenres}
        onToggleGenre={toggleGenre}
        onClearGenres={clearGenres}
        nearMeEnabled={nearMeEnabled}
        onNearMe={requestNearMe}
        geoHint={geoHint}
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
            <p className="text-sm font-medium text-slate-900">No events match your filters yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              Try clearing search, widening the date range, or selecting different tags.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterToolbar({
  searchQuery,
  onSearchChange,
  datePreset,
  onDatePreset,
  customStart,
  customEnd,
  onCustomStart,
  onCustomEnd,
  selectedGenres,
  onToggleGenre,
  onClearGenres,
  nearMeEnabled,
  onNearMe,
  geoHint,
  visibleCount,
  totalCount,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  datePreset: DatePreset;
  onDatePreset: (v: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStart: (v: string) => void;
  onCustomEnd: (v: string) => void;
  selectedGenres: CanonicalGenre[];
  onToggleGenre: (g: CanonicalGenre) => void;
  onClearGenres: () => void;
  nearMeEnabled: boolean;
  onNearMe: () => void;
  geoHint: string | null;
  visibleCount: number;
  totalCount: number;
}) {
  const presetBtn = (preset: DatePreset, label: string) => {
    const active = datePreset === preset;
    return (
      <button
        key={preset}
        type="button"
        onClick={() => onDatePreset(preset)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          active
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
        }`}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="mb-5 space-y-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div>
        <label htmlFor="event-search" className="text-xs font-medium text-slate-600">
          Search
        </label>
        <input
          id="event-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by event or organizer…"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-600">When</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {presetBtn("all", "All dates")}
          {presetBtn("today", "Today")}
          {presetBtn("week", "This week")}
          {presetBtn("weekend", "Weekend")}
          {presetBtn("custom", "Custom")}
        </div>
        {datePreset === "custom" && (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-600">
              From
              <input
                type="date"
                value={customStart}
                onChange={(e) => onCustomStart(e.target.value)}
                className="mt-0.5 block rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              To
              <input
                type="date"
                value={customEnd}
                onChange={(e) => onCustomEnd(e.target.value)}
                className="mt-0.5 block rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-full text-xs font-medium text-slate-600 sm:w-auto">Tags (any match)</p>
          <button
            type="button"
            onClick={onClearGenres}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          >
            Clear tags
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CANONICAL_GENRE_TAGS.map((genre) => {
            const active = selectedGenres.includes(genre);
            const { emoji, className } = getGenrePresentation(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => onToggleGenre(genre)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active ? `${className} ring-2 ring-indigo-400 ring-offset-1` : `${className} opacity-80 hover:opacity-100`
                }`}
                aria-pressed={active}
              >
                <span className="mr-1">{emoji}</span>
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNearMe}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            nearMeEnabled
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          }`}
        >
          📍 Near me
        </button>
        {geoHint && <p className="text-xs text-amber-800">{geoHint}</p>}
      </div>

      <p className="text-xs text-slate-600">
        Showing {visibleCount} of {totalCount} upcoming events.
        {nearMeEnabled && (
          <span className="ml-1">
            Sorted by distance when location is available (geocoding may take a few seconds).
          </span>
        )}
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
  const canonical = getCanonicalGenreForEvent(event);
  const tag = getGenrePresentation(canonical);

  return (
    <div className="grid gap-2.5 md:grid-cols-[140px_1fr]">
      <div className="rounded-lg bg-slate-50 p-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Time</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{timeDisplay}</p>
      </div>
      <div className="min-w-0 max-w-full">
        {event.url ? (
          <Link
            href={event.url}
            className="inline-flex items-center text-base font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
          >
            <span className="break-words">{event.name}</span>
            <span className="ml-2 flex items-center text-slate-500">
              <LinkIcon />
            </span>
          </Link>
        ) : (
          <p className="break-words text-lg font-semibold text-slate-900">{event.name}</p>
        )}
        <div className="mt-1 text-xs text-slate-600">
          {event.organizer?.name && (
            <p className="max-w-full break-words">{event.organizer.name}</p>
          )}
        </div>
        <p
          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${tag.className}`}
        >
          <span className="mr-1">{tag.emoji}</span>
          {canonical}
        </p>
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
                  <span className="ml-1">Open on Google Maps</span>
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
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline-block size-4"
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
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="inline-block size-4"
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351a.75.75 0 0 0 .92 0c1.622-1.288 6.79-5.874 6.79-11.101a7.25 7.25 0 1 0-14.5 0c0 5.227 5.168 9.813 6.79 11.1ZM12 14.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
