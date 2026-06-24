import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design AI — Инфографика для маркетплейсов",
  description: "Генерация инфографики для маркетплейсов с AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
