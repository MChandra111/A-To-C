import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep PDF/DOCX parsers out of the webpack bundle — avoids pdfjs-dist runtime errors.
  serverExternalPackages: ["unpdf", "mammoth", "@react-pdf/renderer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
