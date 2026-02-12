// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { listPageSlugs } from "@/lib/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.decisionclarities.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/compare`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];

  const compareRoutes: MetadataRoute.Sitemap = listPageSlugs().map((slug) => ({
    url: `${siteUrl}/compare/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...compareRoutes];
}
