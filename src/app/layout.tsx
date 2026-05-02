import type { Metadata } from 'next';
import { Geist, Geist_Mono, Bungee, Inter } from 'next/font/google';
import './globals.css';
import { CustomCursor } from '@/components/cursor/CustomCursor';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Display font for the cosmic event branding ("FROM VIBE TO LIVE", etc.)
const bungee = Bungee({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
});

// Body font — stays close to system feel but consistent across platforms.
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'From Vibe to Live · Deploying Your Portfolio with AWS',
  description:
    'AWS Cloud Club PUP · May 2, 2026 · White Cloak Technologies, Pasig City. Build, deploy, and showcase your portfolio with AWS.',
  icons: {
    icon: [{ url: '/awsccpup-logo-circle.webp', type: 'image/webp' }],
    shortcut: '/awsccpup-logo-circle.webp',
    apple: '/awsccpup-logo-circle.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
