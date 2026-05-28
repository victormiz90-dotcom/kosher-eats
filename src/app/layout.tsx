import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KosherEats — Find verified kosher restaurants near you',
  description:
    'The trusted directory of certified kosher restaurants with one-tap ordering through Uber Eats, DoorDash, and Grubhub. Filter by hechsher, cholov yisroel, pas yisroel, and more.',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-50 text-brand-900 antialiased">
        {children}
      </body>
    </html>
  );
}
