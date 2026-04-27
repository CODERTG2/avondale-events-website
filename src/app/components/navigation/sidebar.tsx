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
        <>
            <div
                className={`fixed top-0 w-full h-full overflow-hidden justify-center bg-white dark:bg-gray-900 grid pt-[120px] left-0 z-50 ${isOpen ? "" : "hidden"}`}
            >
                <button className="absolute right-0 p-5" onClick={toggle}>
                    <CloseIcon />
                </button>

                <ul className="text-center text-black dark:text-white leading-relaxed text-xl flex flex-col gap-y-8">

                    <li>
                        <Link href="/" onClick={toggle}>
                            <p>Events</p>
                        </Link>
                    </li>
                    <li>
                        <Link href="/saved" onClick={toggle} className="inline-flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 text-rose-400"
                            >
                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                            <p>Saved Events</p>
                        </Link>
                    </li>
                    <li>
                        <Link href="https://forms.gle/qKwAdmRgGEDykowE8">
                            <p>Submit an Event</p>
                        </Link>
                    </li>
                    <li>
                        <Link href="https://us8.campaign-archive.com/home/?u=33e0baf6c82d89d58ee3edc46&id=708eb4487d">
                            <p>Newsletter</p>
                        </Link>
                    </li>
                    <li>
                        <Link href="https://www.instagram.com/avondale_events/?hl=en">
                            <p>Follow on Instagram</p>
                        </Link>
                    </li>
                    <li>
                        <PwaInstallButton />
                    </li>
                    <li className="border-t border-gray-200 pt-6">
                        {session ? (
                            <button
                                onClick={() => {
                                    signOut({ callbackUrl: "/" });
                                    toggle();
                                }}
                                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                            >
                                Log Out
                            </button>
                        ) : (
                            <Link href="/login" onClick={toggle}>
                                <p className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition">Log In</p>
                            </Link>
                        )}
                    </li>
                </ul>
            </div>
        </>
    );
};

function CloseIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            className="text-black dark:text-white"
        >
            <path
                fill="currentColor"
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
            />
        </svg>
    );
}