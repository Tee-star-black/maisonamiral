import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Shipping", description: "Maison Amiral shipping information." };

export default function ShippingPage() {
  return <EditorialPage eyebrow="Information" title="Shipping." intro="Orders are prepared with care and dispatch details are confirmed during fulfilment. Final delivery timelines and courier terms depend on destination and the selected delivery method." />;
}
