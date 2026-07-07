import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SmartPark Enforce — Every Unpaid Bay, Flagged in Seconds",
  description:
    "Automated parking compliance for RTA & Dubai Police. Bay sensors cross-checked against Parkin payments, violations pushed to the authority platform, patrols routed straight to unpaid vehicles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-sp-bg-0 text-sp-text-1 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
