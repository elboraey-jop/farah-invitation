import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farah & Karim | Wedding Invitation",
  description: "A celebration of love, togetherness, and a beautiful beginning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
