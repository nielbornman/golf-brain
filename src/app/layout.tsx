import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Golf Brain",
  manifest: "/manifest.webmanifest",
  themeColor: "hsl(152 50% 42%)",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Golf Brain",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};





export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
<head>
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-v2.png" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
</head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}

