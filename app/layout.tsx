import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A-To-C | Aspirations to Capabilities",
  description:
    "Measure your dedication to self-investment. Turn ambitions into structured, trackable roadmaps.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "A-To-C",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
