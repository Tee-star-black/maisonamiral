import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { SiteFooter } from "@/components/site-footer";
import styles from "./cart.module.css";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your Maison Amiral pieces and proceed to checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>MAISON AMIRAL / YOUR SELECTION</p>
        <h1>Your <em>cart.</em></h1>
        <CartView />
      </div>
      <SiteFooter />
    </main>
  );
}
