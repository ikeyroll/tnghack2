import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tango Guardian",
  description: "Wearable AI financial defense system real-time fraud interception",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] flex items-center justify-center bg-[#0b1220]">
        {children}
      </body>
    </html>
  );
}
