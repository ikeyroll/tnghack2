import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tango Guardian",
  description: "Wearable AI financial defense system real-time fraud interception",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport = {
  themeColor: "#0057d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tango" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-[100dvh] flex items-center justify-center bg-[#0b1220]">
        {children}
      </body>
    </html>
  );
}
