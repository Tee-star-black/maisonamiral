import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Collections", description: "Maison Amiral collections." };

export default function CollectionsPage() {
  return <EditorialPage eyebrow="Collections" title="Edition 001." intro="The opening Maison Amiral collection. Limited, deliberate and rooted in Johannesburg." />;
}
