import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "labdatadev · gamehub — sua empresa documentada em 10 minutos",
  description:
    "Cadastre seu negócio, ganhe um lote no mapa isométrico da sua região e deixe a IA gerar sua documentação completa (Canvas, Modelo de Negócio, SWOT, Proposta Comercial e mais) — documentação e marketing no piloto automático.",
};

export const viewport: Viewport = {
  themeColor: "#080E1D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
