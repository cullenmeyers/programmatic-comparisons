// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { listCategoryIndexes } from "@/lib/pages";
import { getSiteUrl } from "@/lib/site";

type CategoryConstraintStatus = {
  route: string;
  final_status?: string;
  publish_allowed?: boolean;
  index_submission_allowed?: boolean;
};

type CategoryConstraintStatusFile = {
  pages?: CategoryConstraintStatus[];
};

const CATEGORY_CONSTRAINT_STATUS_PATH = path.join(
  process.cwd(),
  "content",
  "seo",
  "category-constraint-page-status.json"
);

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function listPublishReadyCategoryConstraintRoutes(): string[] {
  const statusFile = readJsonFile<CategoryConstraintStatusFile>(
    CATEGORY_CONSTRAINT_STATUS_PATH
  );

  return (statusFile?.pages ?? [])
    .filter(
      (page) =>
        page.final_status === "publish_ready" &&
        page.publish_allowed === true &&
        page.index_submission_allowed === true
    )
    .map((page) => page.route)
    .filter(Boolean);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/compare`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = listCategoryIndexes().map((category) => ({
    url: `${siteUrl}/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Publish-ready Category + Constraint pages get sitemap priority once they
  // are explicitly allowed for publish and index submission.
  // Proof/internal routes stay excluded until they are publish_ready.
  const categoryConstraintRoutes: MetadataRoute.Sitemap =
    listPublishReadyCategoryConstraintRoutes().map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...categoryConstraintRoutes];
}
