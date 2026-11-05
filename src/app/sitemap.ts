import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const baseUrl = "https://www.maisonamiral.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/shop",
    "/collections",
    "/lookbook",
    "/editorial",
    "/journal",
    "/shipping",
    "/returns",
    "/contact",
    "/privacy", "/cookies",
    "/terms",
  ];

  return [...routes, ...products.map((item) => "/shop/" + item.slug)].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" || route === "/shop" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/shop" ? 0.9 : 0.6,
  }));
}
