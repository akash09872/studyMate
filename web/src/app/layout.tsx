import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'StudyMate — Academic Collaboration Platform',
  description: 'The centralized academic platform for colleges. Access semester-wise notes, PYQs, lab manuals, assignments and contribute quality resources to earn rewards.',
  keywords: ['study materials', 'notes', 'PYQ', 'college', 'academic', 'resources'],
  authors: [{ name: 'StudyMate Team' }],
  openGraph: {
    title: 'StudyMate',
    description: 'Academic collaboration platform for colleges',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
