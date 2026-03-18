export const PUBLIC_BRAND_NAME = "ToolPicker";
export const PRIMARY_SITE_URL = "https://gettoolpicker.com";
export const LEGACY_SITE_HOSTS = [
  "decisionclarities.com",
  "www.decisionclarities.com",
] as const;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || PRIMARY_SITE_URL;
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
