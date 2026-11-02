import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: 'DevType — Developer Typing Studio',
  description: 'Open-source developer typing studio for practicing real TypeScript, Python, and Go code snippets with Supabase telemetry and real-time leaderboards.',
  openGraph: {
    title: 'DevType — Developer Typing Studio',
    description: 'Practice real-world syntax at 120Hz with open-source TypeScript, Python, and Go code snippets.',
    url: 'https://devtype.in',
    siteName: 'DevType',
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'DevType Developer Typing Studio',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevType — Developer Typing Studio',
    description: 'Open-source developer typing studio for practicing real code snippets.',
    images: ['/og.svg'],
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
