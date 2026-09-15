import Link from "next/link";
import styles from "./editorial-page.module.css";

type EditorialPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
};

export function EditorialPage({ eyebrow, title, intro, children }: EditorialPageProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>MAISON AMIRAL</Link>
        <span className={styles.location}>Johannesburg / Edition 001</span>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>

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

      <footer className={styles.footer}>
        <span>© 2026 Maison Amiral</span>
        <span>Objects for presence over noise</span>
        <span>Johannesburg, South Africa</span>
      </footer>
    </main>
  );
}
