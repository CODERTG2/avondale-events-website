import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import "../globals.css";
import Navigation from "../components/navigation/navigation";
import AuthSessionProvider from "../components/session-provider";

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Avondale Events",
  description: "Find things to do in Avondale, Chicago: events, shows, workshops, community meetings, and more.",
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.className} antialiased`}
      >
        <AuthSessionProvider>
          <Navigation />
          <div className="flex-grow mt-16">
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
