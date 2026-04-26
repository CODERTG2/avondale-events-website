import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import "../globals.css";
import Navigation from "../components/navigation/navigation";
import AuthSessionProvider from "../components/session-provider";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "../components/theme-toggle";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${notoSans.className} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthSessionProvider>
            <Navigation />
            <div className="flex-grow mt-16">
              {children}
            </div>
            <ThemeToggle />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
