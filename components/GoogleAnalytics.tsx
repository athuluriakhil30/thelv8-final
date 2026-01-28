'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export function GoogleAnalytics() {
  const pathname = usePathname();
  
  // Don't load GA on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-P9VNTG78DC"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P9VNTG78DC');
          `,
        }}
      />
    </>
  );
}
