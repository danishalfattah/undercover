import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Undercover",
    short_name: "Undercover",
    description: "Game deduksi sosial pass-and-play, 100% offline.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ece2cd",
    theme_color: "#a86a1f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
