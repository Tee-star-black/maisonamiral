import { ArrowIcon } from "@/components/ui-icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { EditionCarousel } from "@/components/edition-carousel";
import { FieldArchive } from "@/components/field-archive";
import { MoreToCome } from "@/components/more-to-come";
import { HousePhilosophy } from "@/components/house-philosophy";
import styles from "./home.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  const schema = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", "@id": "https://www.maisonamiral.co.za/#organization", name: "Maison Amiral", url: "https://www.maisonamiral.co.za/", logo: "https://www.maisonamiral.co.za/icon.svg", email: "support@maisonamiral.co.za", address: { "@type": "PostalAddress", addressLocality: "Johannesburg", addressCountry: "ZA" } },
      { "@type": "WebSite", "@id": "https://www.maisonamiral.co.za/#website", name: "Maison Amiral", url: "https://www.maisonamiral.co.za/", publisher: { "@id": "https://www.maisonamiral.co.za/#organization" }, inLanguage: "en-ZA" }
    ]
  };
  return <main id="top" className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroVisual} aria-hidden="true"><video autoPlay muted loop playsInline preload="metadata" poster="/products/emblem/front-edit.jpeg"><source src="/video/flag.mp4" type="video/mp4" /></video></div>
      <div className={styles.heroContent}>
        <div className={styles.heroMeta}><span>INDEPENDENT CLOTHING / JOHANNESBURG</span><span>EDITION 001 — 2026</span></div>
        <div className={styles.heroTitle}><p>RESTRAINT IN EVERY DETAIL</p><h1 id="hero-heading">Made to<br /><span>be worn.</span></h1></div>
        <div className={styles.heroBottom}><p>Contemporary clothing shaped by movement, memory and everyday life.</p><Link href="/shop" className={styles.heroButton}>Explore the collection <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></Link></div>
      </div>
      <a className={styles.scroll} href="#collection">SCROLL TO EXPLORE <span aria-hidden="true"><ArrowIcon direction="down" /></span></a>
    </section>
    <EditionCarousel />
    <FieldArchive />
    <HousePhilosophy />
    <section className={styles.about} id="about" aria-labelledby="about-heading"><div className={styles.aboutMedia}><Image src="/Edit.jpg" alt="Maison Amiral Emblem Tee worn in an editorial portrait" fill sizes="(max-width: 900px) 100vw, 50vw" /></div><div className={styles.aboutText}><p className={styles.kicker}>04 / THE HOUSE</p><h2 id="about-heading">Clothing with<br /><em>a point of view.</em></h2><p>Maison Amiral is an independent label from Johannesburg. We work with simple forms, graphic details and the belief that the best pieces become part of daily life.</p><Link href="/editorial">Read the house story <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></Link><span className={styles.aboutIndex}>JOHANNESBURG / SOUTH AFRICA</span></div></section>
    <MoreToCome />
    <SiteFooter />
  </main>;
}
