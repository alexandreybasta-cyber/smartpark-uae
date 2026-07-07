import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SpotSense — The Parking Bay Just Became an Agent",
  description:
    "Agentic IoT for parking: light-powered bay sensors, a Qwen agent, and a native iOS app. Drivers find free bays; enforcement goes straight to unpaid ones.",
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
