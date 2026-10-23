import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passe | Liga Fictícia 2026",
  description: "Gestão da liga, do mercado à classificação.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
