import Link from "next/link";
import PwaInstallButton from "../pwa-install-button";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar({
    isOpen,
    toggle,
}: {
    isOpen: boolean;
    toggle: () => void;
}) {
    const { data: session } = useSession();

    return (
        <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={toggle} />

            {/* Panel */}
            <div className={`absolute right-0 top-0 h-full w-full max-w-xs bg-white dark:bg-slate-900 px-6 py-6 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <button
                    className="ml-auto flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-700 transition"
                    onClick={toggle}
                    aria-label="Close menu"
                >
                    <CloseIcon />
                </button>

                <nav className="mt-8">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold mb-4">Menu</p>
                    <ul className="flex flex-col gap-2">
                        <li>
                            <Link href="/" onClick={toggle} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-slate-400 dark:text-slate-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                                Events
                            </Link>
                        </li>
                        <li>
                            <Link href="/saved" onClick={toggle} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-400">
                                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                                Saved Events
                            </Link>
                        </li>

                        <li className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Link href="https://forms.gle/qKwAdmRgGEDykowE8" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition">
                                Submit an Event
                            </Link>
                        </li>
                        <li>
                            <Link href="https://us8.campaign-archive.com/home/?u=33e0baf6c82d89d58ee3edc46&id=708eb4487d" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition">
                                Newsletter
                            </Link>
                        </li>
                        <li>
                            <Link href="https://www.instagram.com/avondale_events/?hl=en" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition">
                                Follow on Instagram
                            </Link>
                        </li>
                        <li className="px-4 py-2">
                            <PwaInstallButton />
                        </li>
                    </ul>
                </nav>

                {/* Auth section pinned to bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-slate-100 dark:border-slate-800">
                    {session ? (
                        <button
                            onClick={() => {
                                signOut({ callbackUrl: "/" });
                                toggle();
                            }}
                            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                            Log Out
                        </button>
                    ) : (
                        <Link href="/login" onClick={toggle} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            Log In
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

function CloseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );
}