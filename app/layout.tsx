import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Muhkam Academy | تعلم البرمجة بشكل عملي',
  description: 'منصة عربية للتقديم في كورسات Muhkam Academy وإدارة الطلبات والفواتير.',
  openGraph: {
    title: 'Muhkam Academy',
    description: 'تدريب عملي ومتابعة واضحة لبداية مهنية في البرمجة.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Muhkam Academy' }],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muhkam Academy',
    description: 'تدريب عملي ومتابعة واضحة لبداية مهنية في البرمجة.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
