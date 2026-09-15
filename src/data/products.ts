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
  images: string[];
};

export const products: MaisonProduct[] = [
  {
    slug: "automobile-tee",
    name: "Automobile Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "AUTO",
    shortDescription: "A graphic study of machinery, movement and memory.",
    description:
      "A restrained everyday tee built around Maison Amiral's fascination with machinery, motion and the objects that become part of our personal history.",
    tone: "#d8d3c8",
    ink: "#151515",
    images: [],
  },
  {
    slug: "guerrilla-tee",
    name: "Guerrilla Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "G/R",
    shortDescription: "Quiet rebellion, reduced to a single wearable object.",
    description:
      "The Guerrilla Tee treats rebellion as restraint rather than noise: a clean silhouette carrying a sharper graphic attitude.",
    tone: "#1b1b1b",
    ink: "#f0ede5",
    images: [],
  },
  {
    slug: "flag-staple-tee",
    name: "Flag Staple Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "FLAG",
    shortDescription: "A staple silhouette with Maison Amiral's flag language.",
    description:
      "A foundational Maison Amiral piece: direct, graphic and designed to work as the anchor of a look rather than compete with it.",
    tone: "#eee9df",
    ink: "#a41f24",
    images: [],
  },
  {
    slug: "emblem-tee",
    name: "Emblem Tee",
    price: 450,
    edition: "Edition 001",
    artMark: "AMIRAL",
    shortDescription: "The house emblem, treated as an object rather than a logo.",
    description:
      "The Emblem Tee is the clearest expression of Edition 001: minimal construction, a confident house mark and enough restraint to let the wearer carry the piece.",
    tone: "#111111",
    ink: "#f4f0e7",
    images: [
      "/products/emblem/front-edit.jpeg",
      "/products/emblem/back-editorial.jpeg",
      "/products/emblem/front.jpeg",
      "/products/emblem/back.jpeg",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price}`;
}
