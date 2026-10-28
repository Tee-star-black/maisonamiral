import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import styles from "./checkout.module.css";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>MAISON AMIRAL / ORDER DETAILS</p>
        <h1>Checkout<span>.</span></h1>
        <CheckoutForm />
      </div>
      <SiteFooter />
    </main>
  );
}
