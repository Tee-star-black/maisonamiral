import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Contact", description: "Contact Maison Amiral." };

export default function ContactPage() {
  return <EditorialPage eyebrow="Maison Amiral / Johannesburg" title="Contact." intro="For orders, stock, press and general enquiries, use the official Maison Amiral contact details provided with your order or through the brand's verified channels." />;
}
