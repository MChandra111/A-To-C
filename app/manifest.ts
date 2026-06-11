import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A-To-C | Aspirations to Capabilities",
    short_name: "A-To-C",
    description:
      "Measure your dedication to self-investment. Step on the scale with honest weigh-ins.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0F0F12",
    theme_color: "#6C63FF",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
