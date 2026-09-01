import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Muhkam Academy | ابدأ رحلتك في البرمجة',
  description: 'قدّم الآن في برنامج Muhkam Academy التدريبي وابدأ طريقك لبناء مستقبل مهني في البرمجة.',
  openGraph: {
    title: 'Muhkam Academy | ابدأ رحلتك في عالم البرمجة',
    description: 'تدريب عملي، مشاريع حقيقية، وخطوة واضحة نحو سوق العمل.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Muhkam Academy' }],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muhkam Academy | ابدأ رحلتك في عالم البرمجة',
    description: 'تدريب عملي ومشاريع حقيقية تؤهلك لسوق العمل.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body>{children}</body>
    </html>
  );
}
