import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = "https://enterprise-wine.vercel.app";

export const metadata: Metadata = {
  title: "Enterprise Wine — CodeWeavers",
  description:
    "Migrate Windows workloads to Linux with Enterprise Wine. Cut licensing costs, eliminate vendor lock-in, and run your apps on any infrastructure.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Enterprise Wine — CodeWeavers",
    description:
      "Run Windows workloads on Linux — no rewrites required. Cut licensing costs, eliminate vendor lock-in.",
    url: siteUrl,
    siteName: "CodeWeavers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enterprise Wine — CodeWeavers",
    description:
      "Run Windows workloads on Linux — no rewrites required. Cut licensing costs, eliminate vendor lock-in.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased relative overflow-x-hidden">
        {/* Black gutters + framing lines — hidden on mobile & tablet */}
        <div className="pointer-events-none fixed inset-0 z-40 hidden 2xl:block">
          <div className="absolute top-0 bottom-0 left-0 w-[clamp(16px,4vw,72px)] bg-black" />
          <div className="absolute top-0 bottom-0 right-0 w-[clamp(16px,4vw,72px)] bg-black" />
          <div className="absolute top-0 bottom-0 left-[clamp(16px,4vw,72px)] w-px bg-gradient-to-b from-transparent via-accent/[0.12] to-transparent" />
          <div className="absolute top-0 bottom-0 right-[clamp(16px,4vw,72px)] w-px bg-gradient-to-b from-transparent via-accent/[0.12] to-transparent" />
        </div>
        {children}
      </body>
    </html>
  );
}
