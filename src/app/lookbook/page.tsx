import { EditionGallery } from "@/components/edition-gallery";
import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  alternates: { canonical: "/lookbook" },
  openGraph: { url: "/lookbook", type: "website", images: ["/opengraph-image"] }, title: "Lookbook", description: "Maison Amiral Edition 001 lookbook." };

export default function LookbookPage() {
  return <EditorialPage eyebrow="Lookbook / 001" title="Shadow. Structure. Movement." intro="A visual study of the first Maison Amiral pieces and the spaces they inhabit."><EditionGallery /></EditorialPage>;
}
