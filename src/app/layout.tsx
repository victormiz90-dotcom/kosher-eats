import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'KosherEats — Find verified kosher restaurants near you',
  description:
    'The trusted directory of certified kosher restaurants with one-tap ordering through Uber Eats, DoorDash, and Grubhub. Filter by hechsher, cholov yisroel, pas yisroel, and more.',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-brand-50 font-sans text-brand-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
