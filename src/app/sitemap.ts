import type { MetadataRoute } from "next";

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
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/shop" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/shop" ? 0.9 : 0.6,
  }));
}
