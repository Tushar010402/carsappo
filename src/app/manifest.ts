import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carsappo — Everything Your Car Needs",
    short_name: "Carsappo",
    description: "Premium car accessories & car care products across India. Daily car cleaning in Greater Noida.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/images/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
