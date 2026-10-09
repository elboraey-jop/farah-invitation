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

const cairo = localFont({
  src: [
    { path: "./fonts/cairo-arabic-regular.ttf", weight: "400" },
    { path: "./fonts/cairo-arabic-semibold.ttf", weight: "600" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

const amiri = localFont({
  src: [
    { path: "./fonts/amiri-arabic-regular.ttf", weight: "400" },
    { path: "./fonts/amiri-arabic-bold.ttf", weight: "700" },
  ],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farah & Karim | Wedding Invitation",
  description: "A celebration of love, togetherness, and a beautiful beginning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${cormorant.variable} ${dmSans.variable} ${cairo.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
