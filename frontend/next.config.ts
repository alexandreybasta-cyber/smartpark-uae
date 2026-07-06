import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet uses window/document so it must only render client-side.
  // No special transpile needed; components importing leaflet should use 'use client' + dynamic import.
  reactStrictMode: true,
};

export default nextConfig;
