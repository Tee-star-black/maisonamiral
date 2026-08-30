import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { SiteFrame } from "@/components/layout/SiteFrame";
import "./globals.css";
import "./nav-balance.css";
import "./footer.css";
import "./store.css";
import "./catalogue.css";
import "./checkout.css";
import "./purchase.css";
import "./eft.css";

const maisonSans = DM_Sans({
  variable: "--font-maison-sans",
  subsets: ["latin"],
});

const maisonDisplay = Cormorant_Garamond({
  variable: "--font-maison-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Maison Amiral",
    template: "%s | Maison Amiral",
  },
  description:
    "Maison Amiral is a Johannesburg fashion label shaped by movement, memory, machinery and restraint.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-ZA"
      className={`${maisonSans.variable} ${maisonDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CartProvider>
          <SiteFrame>{children}</SiteFrame>
        </CartProvider>
      </body>
    </html>
  );
}
