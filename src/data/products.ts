export const BOAT_DELIVERY_FEE_CENTS = 4000;

/** Charge once per order only when the boat floating wheel is present. */
export function getDeliveryFee(items: readonly { slug: string; quantity: number }[] = []) {
  return items.some((item) => item.slug === "boat-floating-wheel" && item.quantity > 0)
    ? BOAT_DELIVERY_FEE_CENTS : 0;
}

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
  stock?: Record<string,number>;
  category?: "apparel" | "accessory";
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
    slug: "redline-bumblebeee-blaze",
    name: "Redline-Bumblebeee Blaze",
    price: 450,
    category: "apparel",
    edition: "Redline Series / 001",
    artMark: "REDLINE",
    shortDescription: "First in the Redline Series: yellow racing graphics framed in red, made for summertime.",
    description:
      "REDLINE-BUMBLEBEEE BLAZE opens the Redline Series. Portrait-style racing graphics sit within a protruding red border. Every graphic is deliberately selected to work with the colours and boat-inspired signage. Not restricted to a season, but right at home in summer. Future Redline releases will explore more colourways suited to warmer days.",
    tone: "#fbd400",
    ink: "#a61f1a",
    images: [
      "/products/redline-bumblebeee-blaze/front.webp",
      "/products/redline-bumblebeee-blaze/detail.webp",
      "/products/redline-bumblebeee-blaze/editorial.webp",
    ],
    imageLabels: ["Front", "Graphic detail", "Sleeve and garment detail"],
  },

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
  {
    slug: "boat-floating-wheel",
    name: "Boat Floating Wheel",
    price: 60,
    category: "accessory",
    edition: "Accessories / 001",
    artMark: "WHEEL",
    shortDescription: "A subtle statement piece designed to elevate whatever you wear it on.",
    description: "A boat wheel-inspired floating lapel accessory designed to subtly stand out and elevate any item it is worn on. Finished in black with red detailing. Dimensions: 29 mm × 30 mm.",
    tone: "#ffffff",
    ink: "#161616",
    images: [
      "/products/boat-floating-wheel/boat-front.jpeg",
      "/products/boat-floating-wheel/boat-detail.jpeg",
      "/products/boat-floating-wheel/boat-lifestyle.jpeg",
    ],
    imageLabels: ["Front", "Detail", "Lifestyle"],
  },

];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return `R${price}`;
}
