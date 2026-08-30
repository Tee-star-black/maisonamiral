import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Maison Amiral | Johannesburg",
    template: "%s | Maison Amiral",
  },
  description:
    "Maison Amiral is a Johannesburg fashion label shaped by movement, memory, machinery and restraint.",
  applicationName: "Maison Amiral",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "/",
    siteName: "Maison Amiral",
    title: "Maison Amiral | Johannesburg",
    description:
      "Clothing for movement, memory and the quiet confidence of things made with intent.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maison Amiral | Johannesburg",
    description:
      "Clothing for movement, memory and the quiet confidence of things made with intent.",
  },
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
