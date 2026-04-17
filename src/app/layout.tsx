import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaInstallProvider } from "@/components/PwaInstallProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const defaultDescription =
  "Porcelain Claire（Claire）的个人博客：记录生活、瓷器文化与日常思考。文章同步自微信公众号，本站提供更安静、更适合慢读的阅读体验。";

export const metadata: Metadata = {
  title: {
    default: "Porcelain Claire — 写给愿意慢慢读的人",
    template: "%s",
  },
  description: defaultDescription,
  metadataBase: new URL("https://porcelainclaire.com"),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Porcelain Claire",
    description: defaultDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Porcelain Claire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Porcelain Claire — 写给愿意慢慢读的人",
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body id="top" className="min-h-dvh flex flex-col antialiased">
        <ThemeProvider>
          <PwaInstallProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
            >
              跳到主要内容
            </a>
            {children}
            <ServiceWorkerRegistration />
          </PwaInstallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
