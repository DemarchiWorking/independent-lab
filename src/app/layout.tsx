import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "labdatadev · gamehub",
  description:
    "Metaverso de negócios isométrico — estilo Startup Panic — com marketplace de serviços de TI reais e parcerias regionais.",
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
