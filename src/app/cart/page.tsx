import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Bag", robots: { index: false, follow: true } };

export default function CartPage() {
  return <EditorialPage eyebrow="Bag" title="Your selection." intro="The production checkout flow still depends on the final commerce and payment implementation. This route now resolves cleanly instead of returning a 404 while that integration is completed." />;
}
