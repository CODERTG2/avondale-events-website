import { Event } from "@/app/lib/definitions";

export const CANONICAL_GENRE_TAGS = [
  "Music",
  "Dance",
  "Theater",
  "Comedy",
  "Creative Arts",
  "Tech",
  "Environment",
  "Games",
  "Community",
  "Social",
  "Food & Drink",
  "Literary",
] as const;

export type CanonicalGenre = (typeof CANONICAL_GENRE_TAGS)[number];

const GENRE_PRESENTATION: Record<
  CanonicalGenre,
  { emoji: string; className: string }
> = {
  Music: { emoji: "🎵", className: "bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800" },
  Dance: { emoji: "💃", className: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200 dark:bg-fuchsia-950/50 dark:text-fuchsia-300 dark:border-fuchsia-800" },
  Theater: { emoji: "🎭", className: "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" },
  Comedy: { emoji: "😂", className: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" },
  "Creative Arts": { emoji: "🎨", className: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" },
  Tech: { emoji: "💻", className: "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600" },
  Environment: { emoji: "🌿", className: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  Games: { emoji: "🎲", className: "bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800" },
  Community: { emoji: "🤝", className: "bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800" },
  Social: { emoji: "🥂", className: "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800" },
  "Food & Drink": { emoji: "🍽️", className: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800" },
  Literary: { emoji: "📚", className: "bg-stone-100 text-stone-900 border-stone-200 dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-600" },
};

export function getGenrePresentation(genre: CanonicalGenre) {
  return GENRE_PRESENTATION[genre];
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Maps indexer/API genre strings into the fixed public tag set.
 */
export function mapToCanonicalGenre(raw?: string | unknown): CanonicalGenre {
  const g = normalize(typeof raw === "string" ? raw : "");

  if (!g) return "Community";

  if (g.includes("food") || g.includes("drink") || g.includes("wine") || g.includes("tasting") || g.includes("cheese") || g.includes("dining"))
    return "Food & Drink";
  if (g.includes("music") || g.includes("karaoke") || g.includes("concert") || g.includes("dj"))
    return "Music";
  if (g.includes("dance") || g.includes("ballet") || g.includes("salsa"))
    return "Dance";
  if (g.includes("theater") || g.includes("theatre") || g.includes("performance"))
    return "Theater";
  if (g.includes("comedy") || g.includes("standup") || g.includes("stand-up"))
    return "Comedy";
  if (g.includes("literary") || g.includes("book") || g.includes("author") || g.includes("reading") || g.includes("poetry"))
    return "Literary";
  if (g.includes("game") || g.includes("wargame") || g.includes("board game") || g.includes("trivia"))
    return "Games";
  if (g.includes("small metal") || g.includes("metals office"))
    return "Tech";
  if (g.includes("tech") || g.includes("coding") || g.includes("hack") || g.includes("3d print"))
    return "Tech";
  if (g.includes("environment") || g.includes("ecology") || g.includes("green"))
    return "Environment";
  if (g.includes("creative") || g.includes("art") || g.includes("craft") || g.includes("ceramic") || g.includes("pinning"))
    return "Creative Arts";
  if (g.includes("watch party")) return "Community";
  if (g.includes("social") || g.includes("network") || g.includes("mixer") || g.includes("party"))
    return "Social";
  if (g.includes("community") || g.includes("meeting") || g.includes("watch party") || g.includes("officers"))
    return "Community";

  return "Community";
}

export function getCanonicalGenreForEvent(event: Event): CanonicalGenre {
  return mapToCanonicalGenre(event.genre);
}
