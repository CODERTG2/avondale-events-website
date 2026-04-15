"use client";

import { Event } from "@/app/lib/definitions";
import { formatTimeRange } from "@/app/lib/time";
import { removePastEvents, generateEventSchedule, DaySchedule } from "../../lib/eventDisplay";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function EventList({ events }: { events: Event[] }) {
  const { data: session } = useSession();
  const [likedEventIds, setLikedEventIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<{ [eventId: string]: number }>({});
  const [loadingLikes, setLoadingLikes] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [session]);

  const fetchLikes = async () => {
    setLoadingLikes(true);
    try {
      const response = await fetch("/api/likes");
      if (response.ok) {
        const data = await response.json();
        setLikedEventIds(data.likedEventIds || []);
        setLikeCounts(data.likeCounts || {});
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  let upcomingEvents = removePastEvents(events);
  let eventSchedule = generateEventSchedule(upcomingEvents);

  return (
    <>
      <div className="">
        {eventSchedule.map((daySchedule: DaySchedule) => (
          <EventListDay 
            daySchedule={daySchedule} 
            likedEventIds={likedEventIds}
            likeCounts={likeCounts}
            onLikeUpdate={fetchLikes}
            key={daySchedule.dayDisplay} 
          />
        ))}
      </div>
    </>
  );
}

function EventListDay({ daySchedule, likedEventIds, likeCounts, onLikeUpdate }: { 
  daySchedule: DaySchedule; 
  likedEventIds: string[];
  likeCounts: { [eventId: string]: number };
  onLikeUpdate: () => void;
}) {

  return (
    <>
      <h2 className="text-2xl py-2 mb-8 border-b-2 border-gray-300" >
        {daySchedule.dayDisplay}
      </h2>
      <div className="pb-16">
        <ul className="text-sm list-none">
          {daySchedule.events.map((event: Event, index: any) => (
            <li key={index} className="flex items-start mb-6 min-w-0">
              <EventDisplay 
                event={event} 
                isLiked={likedEventIds.includes(event.url || '')}
                likeCount={likeCounts[event.url || ''] || 0}
                onLikeUpdate={onLikeUpdate}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};



function EventDisplay({ event, isLiked, likeCount, onLikeUpdate }: { 
  event: Event; 
  isLiked: boolean;
  likeCount: number;
  onLikeUpdate: () => void;
}) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!session) {
      alert("Please log in to like events");
      return;
    }
    if (!event.url) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: event.url }),
      });
      if (response.ok) {
        onLikeUpdate(); // Refresh likes after successful like
      } else {
        const data = await response.json();
        alert(data.error || "Failed to like event");
      }
    } catch (error) {
      console.error("Error liking event:", error);
      alert("Error liking event");
    } finally {
      setIsLoading(false);
    }
  };

  let timeDisplay = formatTimeRange(event);
  const locationLabel = event.venue || event.organizer?.name || "";
  const mapUrl = locationLabel
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`
    : undefined;

  return (
    <>
      <p className="w-1/3 font-semibold pr-6 text-right">
        {timeDisplay}
      </p>
      <div className="w-2/3 min-w-0 max-w-full">
        {event.url ? (
          <Link href={event.url} className="inline-flex items-center hover:underline">
            <span>{event.name}</span>
            <span className="ml-2 text-gray-600 flex items-center">
              <LinkIcon />
            </span>
          </Link>
        ) : (
          <p>{event.name}</p>
        )}
        <div className="text-xs mt-1 text-gray-600">
          {event.organizer?.name && (
            <p className="break-words whitespace-normal break-all max-w-full">
              {event.organizer.name}
            </p>
          )}
          {mapUrl && (
            <Link
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-1 hover:underline"
            >
              <MapPinIcon />
              <span className="ml-1 break-words">{locationLabel}</span>
            </Link>
          )}
          {event.url && (
            <button
              onClick={handleLike}
              disabled={isLoading || isLiked || !session}
              className={`ml-2 mt-1 inline-flex items-center ${isLiked ? 'text-red-500' : session ? 'text-gray-400 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}
            >
              <HeartIcon filled={isLiked} />
              <span className="ml-1">{likeCount > 0 ? likeCount : ''}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};



function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-3 inline-block"
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
      className="size-3 inline-block"
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.351a.75.75 0 0 0 .92 0c1.622-1.288 6.79-5.874 6.79-11.101a7.25 7.25 0 1 0-14.5 0c0 5.227 5.168 9.813 6.79 11.1ZM12 14.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      className="size-3 inline-block"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}
