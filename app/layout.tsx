import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "liderim.lol — Türkiye'nin Lider Şehri Hangisi?",
  description: "Türkiye'nin şehir şehir canlı liderlik sıralaması.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" suppressHydrationWarning><body>{children}</body></html>;
}
