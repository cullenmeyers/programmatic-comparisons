import type { MetadataRoute } from "next";
import { listPageSlugs } from "@/lib/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  // Prefer env var if you ever change domains, but default to your real canonical domain
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.decisionclarities.com"
  ).replace(/\/$/, "");

  const slugs = listPageSlugs();

  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
    },
    ...slugs.map((slug) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: now,
    })),
  ];
}
