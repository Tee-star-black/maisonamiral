import type { Metadata } from "next";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Shop", description: "Shop the Maison Amiral collection from Johannesburg." };

const products = ["Automobile Tee", "Guerrilla Tee", "Flag Staple Tee", "Emblem Tee"];

export default function ShopPage() {
  return <EditorialPage eyebrow="Collection / 001" title="The first objects." intro="A restrained first collection shaped by movement, machinery and memory."><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:24}}>{products.map((product)=><article key={product} style={{borderTop:"1px solid rgba(0,0,0,.25)",paddingTop:18}}><p style={{fontSize:12,letterSpacing:".12em",textTransform:"uppercase"}}>Edition 001</p><h2 style={{fontSize:26,fontWeight:500}}>{product}</h2><p>R450</p></article>)}</div></EditorialPage>;
}
