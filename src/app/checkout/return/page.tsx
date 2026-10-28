import type { Metadata } from "next";
import { PaymentReturn } from "@/components/payment-return";
import { SiteFooter } from "@/components/site-footer";
import styles from "../../checkout.module.css";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; cancelled?: string; failed?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>MAISON AMIRAL / ORDER STATUS</p>
        <PaymentReturn
          orderId={query.order ?? ""}
          cancelled={query.cancelled === "1"}
          failed={query.failed === "1"}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
