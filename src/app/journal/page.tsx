import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  alternates: { canonical: "/journal" },
  openGraph: { url: "/journal", type: "website", images: ["/Edit.jpg"] }, title: "Journal", description: "Notes, references and stories from Maison Amiral." };

export default function JournalPage() {
  return <EditorialPage eyebrow="Journal" title="Notes from the house." intro="References, process, objects and cultural fragments behind Maison Amiral. The journal will grow alongside each edition." />;
}
