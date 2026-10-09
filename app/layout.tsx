import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin.woff2", style: "normal" },
    { path: "./fonts/cormorant-garamond-italic-latin.woff2", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farah & Karim | Wedding Invitation",
  description: "A celebration of love, togetherness, and a beautiful beginning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
