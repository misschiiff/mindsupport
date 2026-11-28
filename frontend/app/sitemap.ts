import type { MetadataRoute } from "next";

const siteUrl = "https://www.mindsupporthq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/start", "/book", "/sessions", "/reflections"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: path === "/reflections" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
