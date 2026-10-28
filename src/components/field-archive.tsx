import Image from "next/image";
import Link from "next/link";
import styles from "./field-archive.module.css";

/**
 * These vector silhouettes follow the user's original photographs.
 * The original JPEGs remain untouched in /public. Inline SVG crops and
 * clips the photo, removing the grass without replacing the garment or person.
 */
const portraits = {
  adjust: {
    id: "ma-field-adjust",
    title: "White utility suit and red gloves, hands raised to adjust the visor",
    src: "/PHOTO-2026-10-26-18-32-12.jpg",
    viewBox: "60 320 345 620",
    width: 720, height: 1280,
    outline: "M205 349 L180 368 L166 396 L125 416 L104 440 L93 479 L92 521 L82 536 L82 569 L93 596 L107 596 L132 609 L128 652 L133 751 L138 775 L152 789 L151 809 L160 834 L158 879 L175 910 L282 915 L292 871 L275 832 L276 816 L281 812 L276 792 L286 779 L298 732 L295 717 L302 711 L291 678 L294 626 L279 579 L279 550 L294 548 L306 564 L340 566 L363 543 L366 520 L359 515 L345 461 L323 424 L270 389 L256 388 L236 357 L220 349Z",
  },
  inspect: {
    id: "ma-field-inspect",
    title: "White utility suit with red gloves, inspecting a red garment",
    src: "/PHOTO-2026-10-26-18-32-12%202.jpg",
    viewBox: "365 190 460 1040",
    width: 960, height: 1280,
    outline: "M586 215 L552 242 L539 264 L466 285 L437 304 L416 328 L397 383 L399 513 L392 547 L397 549 L405 582 L435 616 L413 701 L415 721 L407 744 L408 795 L399 852 L416 881 L416 899 L424 918 L436 925 L444 944 L425 992 L420 1040 L442 1075 L457 1076 L482 1063 L530 1063 L535 1078 L558 1095 L557 1160 L579 1203 L597 1204 L615 1203 L639 1178 L644 1140 L625 1084 L649 1031 L647 1012 L639 999 L662 959 L671 916 L678 907 L668 875 L668 856 L678 836 L675 813 L683 796 L679 784 L686 774 L684 736 L687 700 L692 695 L689 677 L711 639 L729 638 L739 628 L739 613 L755 587 L756 576 L771 566 L769 559 L777 551 L773 514 L785 495 L785 482 L779 476 L783 370 L777 348 L737 306 L710 288 L666 271 L651 242 L633 224 L617 216Z",
  },
  reverse: {
    id: "ma-field-reverse",
    title: "White utility suit seen from behind with a red glove at the side",
    src: "/PHOTO-2026-10-26-18-32-12%203.jpg",
    viewBox: "460 210 235 620",
    width: 960, height: 1280,
    outline: "M584 242 L577 258 L567 258 L544 277 L533 296 L533 322 L512 332 L493 356 L488 373 L487 435 L492 454 L503 464 L514 488 L508 531 L522 600 L517 634 L522 675 L516 690 L520 708 L511 745 L522 762 L547 763 L549 756 L555 755 L575 770 L575 777 L609 786 L632 771 L630 746 L607 728 L635 654 L631 576 L652 563 L657 550 L654 536 L662 519 L659 500 L652 494 L655 450 L644 389 L635 370 L619 363 L614 340 L607 332 L607 319 L622 297 L615 278 L617 261 L611 256 L602 258 L590 242Z",
  },
  foreground: {
    id: "ma-field-foreground",
    title: "White utility suit and red gloves, hands held forward",
    src: "/PHOTO-2026-10-26-18-32-12%204.jpg",
    viewBox: "365 30 455 1090",
    width: 960, height: 1280,
    outline: "M582 60 L556 63 L528 87 L510 124 L469 136 L434 160 L418 181 L400 229 L402 287 L410 309 L404 319 L400 380 L408 407 L428 431 L426 443 L437 448 L444 464 L431 605 L429 705 L437 722 L436 751 L423 775 L420 805 L424 812 L424 884 L418 958 L426 969 L413 1000 L410 1039 L421 1055 L451 1072 L488 1054 L508 1014 L515 981 L505 969 L505 960 L513 956 L519 924 L527 916 L529 880 L539 871 L550 868 L559 874 L556 895 L563 918 L600 940 L631 932 L640 899 L633 873 L623 864 L623 853 L633 833 L633 816 L644 799 L638 788 L639 770 L649 758 L667 711 L660 663 L663 628 L675 612 L670 599 L679 537 L678 498 L689 468 L719 446 L724 415 L755 379 L750 351 L759 342 L753 259 L755 200 L710 151 L687 136 L634 116 L619 85 L603 69Z",
  },
} as const;

function Cutout({ pose, className }: {
  pose: keyof typeof portraits;
  className?: string;
}) {
  const photo = portraits[pose];
  return (
    <svg
      className={className}
      viewBox={photo.viewBox}
      role="img"
      aria-label={photo.title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={photo.id} clipPathUnits="userSpaceOnUse">
          <path d={photo.outline} />
        </clipPath>
      </defs>
      <image
        href={photo.src}
        x="0" y="0"
        width={photo.width}
        height={photo.height}
        clipPath={"url(#" + photo.id + ")"}
      />
    </svg>
  );
}

function ShipMark() {
  return (
    <svg className={styles.shipMark} viewBox="330 246 245 510" role="img" aria-label="Original illustrated warship with red steering wheel, background removed">
      <defs>
        <filter id="ma-ship-art-ink" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 0 2.45"
          />
        </filter>
      </defs>
      <image href="/Ship.jpg" x="0" y="0" width="905" height="1280" filter="url(#ma-ship-art-ink)" />
    </svg>
  );
}

function ShipStudy() {
  return (
    <svg className={styles.shipStudy} viewBox="0 52 722 1175" role="img" aria-label="Original front-facing battleship archive photograph, light sky faded away">
      <defs>
        <filter id="ma-ship-photo-key" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 0 2.08"
          />
        </filter>
        <linearGradient id="ma-ship-bottom-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="76%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <mask id="ma-ship-photo-fade" maskUnits="userSpaceOnUse">
          <rect width="722" height="1285" fill="url(#ma-ship-bottom-fade)" />
        </mask>
      </defs>
      <image
        href="/Ship%202.jpg" x="0" y="0" width="722" height="1285"
        filter="url(#ma-ship-photo-key)"
        mask="url(#ma-ship-photo-fade)"
      />
    </svg>
  );
}

export function FieldArchive() {
  return (
    <section className={styles.section} id="field-notes" aria-labelledby="ma-field-heading">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>03 / THE IMAGE ARCHIVE</span>
          <h2 id="ma-field-heading">Beyond the <em>uniform.</em></h2>
        </div>
        <p className={styles.intro}>Frames from the Maison Amiral archive. Four perspectives, one language. The original subjects and illustrations, stripped of their surroundings.</p>
      </div>

      <div className={styles.composition}>
        <div className={styles.fieldPanel}>
          <div className={styles.fieldMeta}><span>MA / FIELD NOTES</span><span>FIG. 01—04</span></div>
          <span className={styles.backgroundWord} aria-hidden="true">FIELD</span>
          <Cutout pose="reverse" className={styles.poseReverse} />
          <Cutout pose="adjust" className={styles.poseAdjust} />
          <Cutout pose="inspect" className={styles.poseInspect} />
          <Cutout pose="foreground" className={styles.poseForeground} />
          <div className={styles.fieldBottom}>
            <span>FORM / MOVEMENT / IDENTITY</span>
            <span>ARCHIVE 2026</span>
          </div>
        </div>

        <div className={styles.objects}>
          <div className={styles.insignia}>
            <div className={styles.objectHead}><span>02 / SYMBOL</span><span>SHIP I</span></div>
            <ShipMark />
            <div className={styles.objectFoot}><strong>The insignia.</strong><span>Ink / Original archive</span></div>
          </div>
          <div className={styles.vessel}>
            <div className={styles.objectHead}><span>03 / REFERENCE</span><span>SHIP II</span></div>
            <ShipStudy />
            <div className={styles.objectFoot}><strong>Vessel study.</strong><span>Photographic reference</span></div>
          </div>
        </div>
      </div>

      <Link href="/shop/automobile-tee" className={styles.archiveLink}>
        <div className={styles.detailPhoto}>
          <Image src="/PHOTO-2026-06-02-15-55-29.jpg" width={896} height={1152} alt="Original Automobile Tee back, featuring its full printed graphic" />
        </div>
        <div className={styles.detailCopy}>
          <span>04 / GARMENT REFERENCE</span>
          <strong>From the archive to the garment.</strong>
          <p>Original graphic placement, documented in the Automobile Tee.</p>
        </div>
        <span className={styles.detailArrow} aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
