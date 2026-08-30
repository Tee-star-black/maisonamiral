import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Returns", description: "Maison Amiral returns information." };

export default function ReturnsPage() {
  return <EditorialPage eyebrow="Information" title="Returns." intro="Return eligibility, timing and condition requirements are confirmed in the final order terms supplied at purchase. Items should remain unworn, unwashed and in original condition when a return is accepted." />;
}
