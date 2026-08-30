import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import MatchAlerts from "@/app/components/MatchAlerts";
import PWARegister from "@/app/components/PWARegister";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22c55e",
};
export const metadata: Metadata = {
  title: "GoalLive",
  description: "Live football scores, fixtures, results and team information.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}        <MatchAlerts />
              <PWARegister />
      </body>
    </html>
  );
}
