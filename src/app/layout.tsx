import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tirth Patel — Data Scientist & ML Engineer',
  description:
    'Portfolio of Tirth Patel, Data Scientist & ML Engineer pursuing MSBA at UCLA Anderson. Specializing in PySpark, PyTorch, Snowflake, and end-to-end ML pipelines.',
  keywords: ['Data Scientist', 'ML Engineer', 'UCLA Anderson', 'MSBA', 'PySpark', 'PyTorch', 'Portfolio'],
  authors: [{ name: 'Tirth Patel' }],
  openGraph: {
    type: 'website',
    title: 'Tirth Patel — Data Scientist & ML Engineer',
    description:
      'Portfolio of Tirth Patel, Data Scientist & ML Engineer pursuing MSBA at UCLA Anderson. Specializing in PySpark, PyTorch, Snowflake, and end-to-end ML pipelines.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tirth Patel — Data Scientist & ML Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tirth Patel — Data Scientist & ML Engineer',
    description:
      'Portfolio of Tirth Patel, Data Scientist & ML Engineer pursuing MSBA at UCLA Anderson.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
