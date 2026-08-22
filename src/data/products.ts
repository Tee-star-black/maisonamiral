export type Product = {
  slug: string;
  name: string;
  shortName: string;
  price: number;
  currency: "ZAR";
  collection: string;
  description: string;
  details: string[];
  sizes: string[];
  assetStatus: "ready" | "awaiting-images";
  images: {
    front?: string;
    back?: string;
    editorialFront?: string;
    editorialBack?: string;
  };
};

export const products: Product[] = [
  {
    slug: "emblem-tee",
    name: "Flagship Emblem Tee",
    shortName: "Emblem Tee",
    price: 450,
    currency: "ZAR",
    collection: "Edition 001",
    description:
      "A restrained house staple built around the Maison Amiral emblem and the visual language of the first collection.",
    details: [
      "Relaxed unisex silhouette",
      "Maison Amiral emblem artwork",
      "Edition 001 house staple",
      "Designed in Johannesburg",
    ],
    sizes: ["S", "M", "L", "XL"],
    assetStatus: "ready",
    images: {
      front: "/products/emblem/front.jpeg",
      back: "/products/emblem/back.jpeg",
      editorialFront: "/products/emblem/front-edit.jpeg",
      editorialBack: "/products/emblem/back-editorial.jpeg",
    },
  },
  {
    slug: "automobile-tee",
    name: "Automobile Tee",
    shortName: "Automobile Tee",
    price: 450,
    currency: "ZAR",
    collection: "Edition 001",
    description:
      "An automotive-led Maison Amiral graphic tee shaped by movement, machinery and the visual language of the road.",
    details: [
      "Relaxed unisex silhouette",
      "Automotive graphic artwork",
      "Edition 001 release",
      "Designed in Johannesburg",
    ],
    sizes: ["S", "M", "L", "XL"],
    assetStatus: "awaiting-images",
    images: {},
  },
  {
    slug: "guerrilla-tee",
    name: "Guerrilla Tee",
    shortName: "Guerrilla Tee",
    price: 450,
    currency: "ZAR",
    collection: "Edition 001",
    description:
      "A bolder graphic expression from Edition 001, balancing street-culture energy with Maison Amiral restraint.",
    details: [
      "Relaxed unisex silhouette",
      "Guerrilla graphic artwork",
      "Edition 001 release",
      "Designed in Johannesburg",
    ],
    sizes: ["S", "M", "L", "XL"],
    assetStatus: "awaiting-images",
    images: {},
  },
  {
    slug: "flag-staple-tee",
    name: "Flag Staple Tee",
    shortName: "Flag Staple Tee",
    price: 450,
    currency: "ZAR",
    collection: "Edition 001",
    description:
      "A house staple built around the flag motif, carrying Maison Amiral's maritime codes into a simple everyday uniform.",
    details: [
      "Relaxed unisex silhouette",
      "Maison Amiral flag motif",
      "Edition 001 release",
      "Designed in Johannesburg",
    ],
    sizes: ["S", "M", "L", "XL"],
    assetStatus: "awaiting-images",
    images: {},
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price.toLocaleString("en-ZA")}`;
}
