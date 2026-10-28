import Link from "next/link";
import styles from "./editorial-page.module.css";
import { SiteFooter } from "./site-footer";

type EditorialPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
};

export function EditorialPage({ eyebrow, title, intro, children }: EditorialPageProps) {
  return (
    <main className={styles.page}>

      <section className={styles.hero}>
        <div className={styles.heroTopline}>
          <span>{eyebrow}</span>
          <span>Maison Amiral / 2026</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.introRow}>
          <span className={styles.introIndex}>Johannesburg / South Africa</span>
          <p className={styles.intro}>{intro}</p>
        </div>
      </section>

      {children && <div className={styles.content}>{children}</div>}

      <SiteFooter />
    </main>
  );
}
