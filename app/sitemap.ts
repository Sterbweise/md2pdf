import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://md2pdf.my";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Add more pages here as your site grows, e.g.:
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified,
    //   changeFrequency: "monthly",
    //   priority: 0.8,
    // },
  ];
}
