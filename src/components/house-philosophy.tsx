import { ArrowIcon } from "@/components/ui-icons";
import Image from "next/image";
import Link from "next/link";
import styles from "./house-philosophy.module.css";

/**
 * Restores the wheel motif from the earlier Maison Amiral experience
 * without introducing animations that compete with the garment studio.
 */
export function HousePhilosophy() {
  return (
    <section className={styles.section} id="philosophy" aria-labelledby="house-philosophy-title">
      <div className={styles.heading}>
        <span>04 / HOUSE PHILOSOPHY</span>
        <span>JOHANNESBURG / SOUTH AFRICA</span>
      </div>
      <div className={styles.layout}>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.ringOuter}>
            <Image src="/graphics/wheel.png" alt="" fill sizes="(max-width: 800px) 85vw, 48vw" className={styles.wheel} />
          </div>
          <div className={styles.ringInner}>
            <Image src="/graphics/wheel.png" alt="" fill sizes="(max-width: 800px) 45vw, 24vw" className={styles.wheel} />
          </div>
          <span className={styles.visualCode}>MA / 001</span>
          <span className={styles.visualNote}>FORM / MOVEMENT / MEMORY</span>
        </div>
        <div className={styles.copy}>
          <p className={styles.kicker}>THE PHILOSOPHY</p>
          <h2 id="house-philosophy-title">Form follows<br /><em>movement.</em></h2>
          <p className={styles.lead}>
            We make clothing to move through life in, not pieces designed to demand attention.
          </p>
          <p className={styles.description}>
            Maison Amiral draws from machinery, maritime codes and Johannesburg street culture.
            Every garment is an exercise in proportion, purpose and restraint. The details
            matter because the person wearing them matters more.
          </p>
          <Link href="/editorial" className={styles.link}>
            Explore our philosophy <span aria-hidden="true"><ArrowIcon direction="up-right" /></span>
          </Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>INDEPENDENT BY DESIGN</span>
        <span>EST. JOHANNESBURG / 2026</span>
      </div>
    </section>
  );
}
