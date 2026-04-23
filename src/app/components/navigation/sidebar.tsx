import Link from "next/link";
import PwaInstallButton from "../pwa-install-button";

export default function Sidebar({
    isOpen,
    toggle,
}: {
    isOpen: boolean;
    toggle: () => void;
}) {
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
                        <Link href="/" className="block rounded-lg border border-slate-200 px-4 py-3 font-medium hover:border-indigo-300 hover:text-indigo-700">
                            Events
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
                </ul>
            </div>
        </div>
    );
};

function CloseIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
        >
            <path
                fill="currentColor"
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
            />
        </svg>
    );
}