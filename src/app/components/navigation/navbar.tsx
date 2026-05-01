import Link from "next/link";

export default function Navbar({ toggle }: { toggle: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-indigo-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center">
          <Logo />
          <div className="ml-3">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 md:text-lg">Avondale Events</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Neighborhood calendar + map</p>
          </div>
        </Link>
        <button
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400"
          onClick={toggle}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
};

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function Logo() {
  return (
    <img src="/icon.png" alt="Avondale Events logo" width={42} height={42} className="rounded-lg" />
  );
}