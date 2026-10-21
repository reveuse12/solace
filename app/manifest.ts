import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solace",
    short_name: "Solace",
    description: "A quiet space for intentions, audio rituals, and reflection.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    id: "/",
    background_color: "#f4eee8",
    theme_color: "#f4eee8",
    icons: [{ src: "/solace-icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" }, { src: "/solace-splash.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" }],
  };
}
