import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/manager", "/work-in-progress"] },
    sitemap: "https://www.mindsupporthq.com/sitemap.xml",
    host: "https://www.mindsupporthq.com",
  };
}
