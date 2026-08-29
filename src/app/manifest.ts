import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget King BD",
    short_name: "Budget King",
    description: "Quality Without the Markup — Cash on Delivery everywhere in Bangladesh",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#d4a017",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
