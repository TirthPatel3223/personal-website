import type { Metadata } from 'next';
import { Geist_Mono, Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ChatProvider } from '@/components/ChatProvider';
import Chat from '@/components/Chat';
import './globals.css';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tirth Patel | Data Scientist & ML Engineer',
  description:
    'Portfolio of Tirth Patel, Data Scientist & ML Engineer pursuing MSBA at UCLA Anderson. Specializing in PySpark, PyTorch, Snowflake, and end-to-end ML pipelines.',
  keywords: ['Data Scientist', 'ML Engineer', 'UCLA Anderson', 'MSBA', 'PySpark', 'PyTorch', 'Portfolio'],
  authors: [{ name: 'Tirth Patel' }],
  openGraph: {
    type: 'website',
    title: 'Tirth Patel | Data Scientist & ML Engineer',
    description:
      'Portfolio of Tirth Patel, Data Scientist & ML Engineer pursuing MSBA at UCLA Anderson. Specializing in PySpark, PyTorch, Snowflake, and end-to-end ML pipelines.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tirth Patel | Data Scientist & ML Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tirth Patel | Data Scientist & ML Engineer',
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Set initial theme before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.add(t);})()`,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ChatProvider>
            {children}
            <Chat />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
