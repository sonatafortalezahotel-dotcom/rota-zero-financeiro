import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rota Zero — Controle Financeiro",
  description: "Painel pessoal para organizar acordos, vencimentos e a jornada até a dívida zero.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
