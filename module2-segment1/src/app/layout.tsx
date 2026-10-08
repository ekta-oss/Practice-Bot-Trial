import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Module 2 · Segment 1: Your First Morning",
  description: "Everyday Workplace Communication — Module 2, Segment 1, Stages 1.1–1.6.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
