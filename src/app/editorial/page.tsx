import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Editorial", description: "The Maison Amiral editorial statement." };

export default function EditorialStatementPage() {
  return <EditorialPage eyebrow="Editorial / Vol. 01" title="Silence is the new luxury." intro="Maison Amiral lives between tailoring and street culture, machinery and memory, restraint and rebellion. We make pieces that do not ask for attention. They hold it." />;
}
