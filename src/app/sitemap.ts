import type { MetadataRoute } from "next";
import { listPageSlugs } from "@/lib/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, "");

  const slugs = listPageSlugs();

  return [
    { url: baseUrl, lastModified: new Date() },
    ...slugs.map((slug) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
