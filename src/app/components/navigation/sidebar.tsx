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
            className={`fixed inset-0 z-50 overflow-hidden bg-slate-900/45 backdrop-blur-sm ${isOpen ? "" : "hidden"}`}
        >
            <div className="ml-auto h-full w-full max-w-sm bg-white px-6 py-6 shadow-2xl">
                <button className="ml-auto block rounded-lg border border-slate-200 p-2 text-slate-700" onClick={toggle} aria-label="Close menu">
                    <CloseIcon />
                </button>
                <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">Quick Links</p>
                <ul className="mt-4 flex flex-col gap-y-4 text-slate-800">
                    <li>
                        <Link href="/" onClick={toggle} className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700">
                            Events
                        </Link>
                    </li>
                    <li>
                        <Link href="/saved" onClick={toggle} className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700 inline-flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-400">
                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                            Saved Events
                        </Link>
                    </li>
                    <li>
                        <Link href="https://forms.gle/qKwAdmRgGEDykowE8" className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700">
                            Submit an Event
                        </Link>
                    </li>
                    <li>
                        <Link href="https://us8.campaign-archive.com/home/?u=33e0baf6c82d89d58ee3edc46&id=708eb4487d" className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700">
                            Newsletter
                        </Link>
                    </li>
                    <li>
                        <Link href="https://www.instagram.com/avondale_events/?hl=en" className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700">
                            Follow on Instagram
                        </Link>
                    </li>
                    <li className="pt-2">
                        <PwaInstallButton />
                    </li>
                    <li className="border-t border-slate-200 pt-6">
                        {session ? (
                            <button
                                onClick={() => {
                                    signOut({ callbackUrl: "/" });
                                    toggle();
                                }}
                                className="text-slate-500 hover:text-indigo-700 transition cursor-pointer font-medium"
                            >
                                Log Out
                            </button>
                        ) : (
                            <Link href="/login" onClick={toggle}>
                                <p className="text-slate-500 hover:text-indigo-700 transition font-medium">Log In</p>
                            </Link>
                        )}
                    </li>
                </ul>
            </div>
        </div>
    );
};

function CloseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-slate-700">
            <path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
        </svg>
    );
}