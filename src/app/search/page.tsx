import { getCatalogue } from "@/lib/catalogue";
import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/data/products";
import { EditorialPage } from "@/components/editorial-page";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };
export default async function SearchPage({ searchParams }: { searchParams: Promise<{q?:string}> }) {
  const products = await getCatalogue();
  const {q = ""} = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0,100) : "";
  const found = products.filter(product => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()));
  return <EditorialPage eyebrow="Search" title="Find an object." intro="Find a piece in the current Maison Amiral collection.">
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <form action="/search" style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:32}}>
        <label style={{flex:"1 1 240px"}}>Search the collection<input name="q" defaultValue={query} type="search" maxLength={100} style={{display:"block",width:"100%",border:"1px solid",padding:16,marginTop:8}} /></label>
        <button style={{alignSelf:"end",background:"#151515",color:"white",padding:"16px 24px"}}>SEARCH</button>
      </form>
      <p>{found.length} result{found.length === 1 ? "" : "s"}{query ? ` for “${query}”` : ""}.</p>
      {found.map(product => <Link key={product.slug} href={"/shop/"+product.slug} style={{display:"flex",justifyContent:"space-between",gap:20,padding:"24px 0",borderBottom:"1px solid #ddd"}}><span>{product.name}</span><span>{formatPrice(product.price)}</span></Link>)}
      {!found.length && <p style={{marginTop:24}}>Try “tee” or “wheel”, or <Link href="/shop" style={{textDecoration:"underline"}}>browse all pieces</Link>.</p>}
    </div>
  </EditorialPage>;
}
