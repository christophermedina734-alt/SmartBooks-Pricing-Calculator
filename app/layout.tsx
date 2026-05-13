import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartBooks CPA Pricing Calculator",
  description: "Bookkeeping and advisory quote calculator for SmartBooks CPA"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
