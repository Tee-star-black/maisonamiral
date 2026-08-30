import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Privacy", description: "Maison Amiral privacy information." };

export default function PrivacyPage() {
  return <EditorialPage eyebrow="Legal" title="Privacy." intro="Maison Amiral should only collect and process personal information required to operate the store, fulfil orders, provide support and meet applicable legal obligations. Production privacy wording should reflect the final commerce, analytics and email services in use." />;
}
