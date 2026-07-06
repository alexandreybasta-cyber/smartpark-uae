import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartPark UAE — Never Circle the Lot Again",
  description:
    "AI-powered smart parking for UAE. Real-time spot availability, predictive occupancy, and intelligent navigation across Dubai Internet City.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-sp-bg-0 text-sp-text-1 font-sans">
        {children}
      </body>
    </html>
  );
}
