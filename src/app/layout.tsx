import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreHeader } from "@/components/store-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.maisonamiral.co.za"),
  title: {
    default: "Maison Amiral | Independent Clothing & Accessories Johannesburg",
    template: "%s | Maison Amiral",
  },
  description:
    "Discover Maison Amiral clothing and accessories, designed in Johannesburg, South Africa. Shop considered graphic tees and original accessories.",
  keywords: ["Maison Amiral", "Maison Amiral South Africa", "Johannesburg clothing brand", "South African streetwear", "graphic T-shirts", "fashion accessories"],
  category: "shopping",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  applicationName: "Maison Amiral",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "/",
    siteName: "Maison Amiral",
    title: "Maison Amiral | Clothing & Accessories from Johannesburg",
    description:
      "Discover independently designed Maison Amiral clothing and accessories from Johannesburg, South Africa.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Maison Amiral original clothing collection" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "Maison Amiral | Johannesburg",
    description:
      "Clothing for movement, memory and the quiet confidence of things made with intent.",
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full"><StoreHeader />{children}</body>
    </html>
  );
}
