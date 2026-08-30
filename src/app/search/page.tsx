import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default function SearchPage() {
  return <EditorialPage eyebrow="Search" title="Find an object." intro="Edition 001 is intentionally small. Browse the current collection from the shop while full catalogue search is prepared for future editions." />;
}
