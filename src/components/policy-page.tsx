import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import styles from "./policy-page.module.css";
export function PolicyPage({ eyebrow,title,intro,children }: {
 eyebrow:string;title:string;intro:string;children:ReactNode;
}) {
 return <main className={styles.page}><div className={styles.wrap}>
 <p className={styles.eyebrow}>{eyebrow}</p><h1 className={styles.title}>{title}</h1>
 <p className={styles.intro}>{intro}</p>
 <div className={styles.layout}><aside className={styles.side}>MAISON AMIRAL<br/>CUSTOMER INFORMATION<br/>UPDATED 03 NOVEMBER 2026</aside>
 <div className={styles.content}>{children}<p className={styles.foot}>For assistance, email <a href="mailto:support@maisonamiral.co.za">support@maisonamiral.co.za</a>.</p></div></div></div><SiteFooter/></main>;
}