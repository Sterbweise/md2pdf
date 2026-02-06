import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MD to PDF Converter",
  description:
    "Convert Markdown and Notion pages to beautifully formatted PDFs",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
