import Image from "next/image";
import Link from "next/link";
import { MannequinExperience } from "@/components/mannequin-experience";
import { SiteFooter } from "@/components/site-footer";
import { products, formatPrice } from "@/data/products";
import styles from "./home.module.css";

export default function Home() {
  return <main id="top" className={styles.page}>
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroVisual} aria-hidden="true"><video autoPlay muted loop playsInline preload="metadata" poster="/products/emblem/front-edit.jpeg"><source src="/video/flag.mp4" type="video/mp4" /></video></div>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">MAISON AMIRAL<span className={styles.brandMark}> / MA</span></Link>
        <nav className={styles.nav} aria-label="Primary navigation"><a href="#collection">Collection</a><a href="#fitting-studio">Studio</a><a href="#about">About</a></nav>
        <Link className={styles.headerShop} href="/shop">Shop Edition 001 <span aria-hidden="true">↗</span></Link>
      </header>
      <div className={styles.heroContent}>
        <div className={styles.heroMeta}><span>INDEPENDENT CLOTHING / JOHANNESBURG</span><span>EDITION 001 — 2026</span></div>
        <div className={styles.heroTitle}><p>RESTRAINT IN EVERY DETAIL</p><h1 id="hero-heading">Made to<br /><span>be worn.</span></h1></div>
        <div className={styles.heroBottom}><p>Contemporary clothing shaped by movement, memory and everyday life.</p><Link href="/shop" className={styles.heroButton}>Explore the collection <span aria-hidden="true">↗</span></Link></div>
      </div>
      <a className={styles.scroll} href="#collection">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
    </section>
    <section className={styles.collection} id="collection" aria-labelledby="collection-heading">
      <div className={styles.sectionHead}><div><p className={styles.kicker}>01 / THE COLLECTION</p><h2 id="collection-heading">Edition 001.</h2></div><div className={styles.sectionAside}><p>Four objects. One point of view.<br />Designed in Johannesburg.</p><Link href="/shop">View all pieces <span aria-hidden="true">↗</span></Link></div></div>
      <div className={styles.collectionGrid}>
        <Link className={styles.feature} href="/shop/emblem-tee"><div className={styles.featureVisual}><Image src="/products/emblem/front-edit.jpeg" alt="Maison Amiral Emblem Tee campaign photograph" fill sizes="(max-width: 900px) 100vw, 56vw" /></div><div className={styles.featureMeta}><span><small>01 / FEATURED PIECE</small><strong>Emblem Tee</strong></span><span>R450 <span aria-hidden="true">↗</span></span></div></Link>
        <div className={styles.collectionList}><div className={styles.listHead}><span>EDITION 001 / INDEX</span><span>04 PIECES</span></div>
          {products.map((product,index)=><Link href={"/shop/"+product.slug} key={product.slug} className={styles.productRow}><span className={styles.number}>{String(index+1).padStart(2,"0")}</span><span className={styles.productName}>{product.name}<small>{product.shortDescription}</small></span><span className={styles.productPrice}>{formatPrice(product.price)}</span><span className={styles.arrow} aria-hidden="true">↗</span></Link>)}
          <div className={styles.listFoot}><span>ORIGINAL EDITION / JOHANNESBURG</span><Link href="/shop">SHOP ALL ↗</Link></div>
        </div>
      </div>
    </section>
    <div id="fitting-studio"><MannequinExperience /></div>
    <section className={styles.about} id="about" aria-labelledby="about-heading"><div className={styles.aboutMedia}><Image src="/products/emblem/back-editorial.jpeg" alt="Emblem Tee from behind in Maison Amiral editorial photography" fill sizes="(max-width: 900px) 100vw, 50vw" /></div><div className={styles.aboutText}><p className={styles.kicker}>02 / THE HOUSE</p><h2 id="about-heading">Clothing with<br /><em>a point of view.</em></h2><p>Maison Amiral is an independent label from Johannesburg. We work with simple forms, graphic details and the belief that the best pieces become part of daily life.</p><Link href="/editorial">Read the house story <span aria-hidden="true">↗</span></Link><span className={styles.aboutIndex}>JOHANNESBURG / SOUTH AFRICA</span></div></section>
    <SiteFooter />
  </main>;
}
