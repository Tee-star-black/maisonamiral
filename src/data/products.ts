export type GarmentPrint = {
  src: string;
  width: number;
  height: number;
  centerY: number;
};

export type MaisonProduct = {
  slug: string;
  name: string;
  price: number;
  edition: string;
  artMark: string;
  shortDescription: string;
  description: string;
  tone: string;
  ink: string;
  /** Real garment photography, ordered front, back, then editorial/detail. */
  images: string[];
  imageLabels: string[];
  /** Extracted transparent ink from the original garment photographs. */
  artwork?: { front?: GarmentPrint; back?: GarmentPrint };
};

const asset = (product: string, file: string) =>
  `/products/edition-001/${product}/${file}`;

export const products: MaisonProduct[] = [
  {
    slug: "automobile-tee",
    name: "Automobile Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "AUTO",
    shortDescription: "The automobile graphic, finished with a collage of house references.",
    description:
      "A black everyday tee with a front automobile graphic, a printed back collage and a detailed sleeve patch graphic. The original garment photography shows the design as it is.",
    tone: "#151515",
    ink: "#f4f0e7",
    images: [
      "/Automobile front.jpg",
      "/Automobile 2.jpg",
      "/Automobile back.jpg",
      "/PHOTO-2026-06-02-15-55-29.jpg",
    ],
    imageLabels: ["Front", "Back", "Back detail", "Archive graphic"],
    artwork: {
      front: { src: asset("automobile", "print-front.png"), width: 0.255, height: 0.16, centerY: 1.25 },
      back: { src: asset("automobile", "print-back.png"), width: 0.33, height: 0.51, centerY: 1.2 },
    },
  },
  {
    slug: "guerrilla-tee",
    name: "Guerrilla Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "G/R",
    shortDescription: "An oval graphic framed by precision and streetwear attitude.",
    description:
      "A black T-shirt featuring the original Guerrilla front graphic. Browse the garment shot and the editorial image of the tee being worn.",
    tone: "#171717",
    ink: "#f4f0e7",
    images: [
      "/Guerilla.jpg",
      "/Guerilla 2.jpg",
    ],
    imageLabels: ["Front", "On model"],
    artwork: {
      front: { src: asset("guerrilla", "print-front.png"), width: 0.31, height: 0.167, centerY: 1.335 },
    },
  },
  {
    slug: "emblem-tee",
    name: "Emblem Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "AMIRAL",
    shortDescription: "The original winged flagship graphic with a small back emblem.",
    description:
      "The Emblem Tee features the bold winged front print and a smaller house emblem on the reverse. Explore the original front, back and on-body photographs.",
    tone: "#131313",
    ink: "#f4f0e7",
    images: [
      "/Emblem front.jpg",
      "/Emblem back.jpg",
      "/Edit.jpg",
    ],
    imageLabels: ["Front", "Back", "On model"],
    artwork: {
      front: { src: asset("emblem", "print-front.png"), width: 0.335, height: 0.4, centerY: 1.225 },
      back: { src: asset("emblem", "print-back.png"), width: 0.1, height: 0.16, centerY: 1.38 },
    },
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price}`;
}
