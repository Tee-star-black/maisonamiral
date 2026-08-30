import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Lookbook", description: "Maison Amiral Edition 001 lookbook." };

export default function LookbookPage() {
  return <EditorialPage eyebrow="Lookbook / 001" title="Shadow. Structure. Movement." intro="A visual study of the first Maison Amiral pieces and the spaces they inhabit." />;
}
