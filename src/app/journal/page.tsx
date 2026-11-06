import Link from "next/link";
import { products } from "@/data/products";
import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  alternates: { canonical: "/journal" },
  openGraph: { url: "/journal", type: "website", images: ["/opengraph-image"] }, title: "Journal", description: "Notes, references and stories from Maison Amiral." };

export default function JournalPage() {
  return <EditorialPage eyebrow="Journal" title="Notes from the house." intro="References, process, objects and cultural fragments behind Maison Amiral. Explore the details of Edition 001.">{products.map(product => <article key={product.slug} style={{maxWidth:760,margin:"0 auto 48px"}}><h2 style={{fontFamily:"Georgia,serif",fontSize:32,marginBottom:16}}>{product.name}</h2><p style={{lineHeight:1.8,marginBottom:16}}>{product.description}</p><Link href={"/shop/"+product.slug} style={{textDecoration:"underline"}}>Explore {product.name}</Link></article>)}</EditorialPage>;
}
