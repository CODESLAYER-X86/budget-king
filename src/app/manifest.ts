import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget King BD",
    short_name: "Budget King",
    description: "Quality That Fits Your Budget — Cash on Delivery everywhere in Bangladesh",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8e7",
    theme_color: "#d4a017",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
