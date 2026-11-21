import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silent Zenith — Compounding OS & Macro Terminal",
  description:
    "Trading Journal, Compounding Simulator, Macro Calendar & Personal Assistant OS",
};

const localFontVariables = {
  "--font-geist-sans":
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  "--font-geist-mono":
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" style={localFontVariables}>
      <body className="antialiased bg-[#060911] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}