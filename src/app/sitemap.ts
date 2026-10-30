import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE.url}/`, lastModified, priority: 1.0 },
    { url: `${SITE.url}/login`, lastModified, priority: 0.6 },
    { url: `${SITE.url}/register`, lastModified, priority: 0.6 },
    { url: `${SITE.url}/forgot-password`, lastModified, priority: 0.4 },
    { url: `${SITE.url}/privacy`, lastModified, priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified, priority: 0.3 },
  ];
}
