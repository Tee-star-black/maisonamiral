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
  images: {
    front: string;
    back: string;
    editorialFront: string;
    editorialBack: string;
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
    images: {
      front: "/products/emblem/front.jpeg",
      back: "/products/emblem/back.jpeg",
      editorialFront: "/products/emblem/front-edit.jpeg",
      editorialBack: "/products/emblem/back-editorial.jpeg",
    },
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price.toLocaleString("en-ZA")}`;
}
