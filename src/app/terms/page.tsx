import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Terms", description: "Maison Amiral store terms." };

export default function TermsPage() {
  return <EditorialPage eyebrow="Legal" title="Terms." intro="Store terms govern ordering, payment, fulfilment, returns and use of the Maison Amiral website. Final production terms should match the active payment, delivery and customer-support processes." />;
}
