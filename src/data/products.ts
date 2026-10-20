/** Normalised (0–1) photo crop and location on the digital fabric surface. */
export type ProductPrint = {
  image: string;
  crop: { x: number; y: number; width: number; height: number };
  placement: { x: number; y: number; width: number; height: number };
  /** Extract colourful artwork from photographed black fabric, retaining its transparent gaps. */
  transparentBlack?: boolean;
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
  images: string[];
  /** Only genuine, supplied product photographs should populate this field. */
  prints?: { front: ProductPrint; back?: ProductPrint };
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
    tone: "#161616",
    ink: "#f6f4ed",
    images: [
      "/products/car-capsule/Automobile1.jpeg",
      "/products/car-capsule/back2.jpeg",
      "/products/car-capsule/front.jpg",
      "/products/car-capsule/back.jpg",
    ],
    prints: {
      front: {
        image: "/products/car-capsule/front.jpg",
        crop: { x: 0.397, y: 0.459, width: 0.334, height: 0.163 },
        placement: { x: 0.27, y: 0.325, width: 0.46, height: 0.18 },
      },
      back: {
        image: "/products/car-capsule/back.jpg",
        crop: { x: 0.331, y: 0.406, width: 0.46, height: 0.545 },
        placement: { x: 0.245, y: 0.275, width: 0.51, height: 0.49 },
        transparentBlack: true,
      },
    },
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
    images: [
      "/products/flagship-inc/Guerilla1.jpeg",
      "/products/flagship-inc/Gedit.jpeg",
      "/products/flagship-inc/front.jpg",
      "/products/flagship-inc/detail.jpg",
    ],
    prints: {
      front: {
        image: "/products/flagship-inc/front.jpg",
        crop: { x: 0.322, y: 0.452, width: 0.472, height: 0.245 },
        placement: { x: 0.20, y: 0.31, width: 0.60, height: 0.24 },
        transparentBlack: true,
      },
    },
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
    prints: {
      front: {
        image: "/products/emblem/front.jpeg",
        crop: { x: 0.333, y: 0.277, width: 0.334, height: 0.389 },
        placement: { x: 0.19, y: 0.24, width: 0.62, height: 0.47 },
        transparentBlack: true,
      },
      back: {
        image: "/products/emblem/back.jpeg",
        crop: { x: 0.47, y: 0.244, width: 0.096, height: 0.115 },
        placement: { x: 0.45, y: 0.13, width: 0.10, height: 0.155 },
        transparentBlack: true,
      },
    },
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price}`;
}
