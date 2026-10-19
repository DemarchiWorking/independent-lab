import type { Metadata, Viewport } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";
import { Provedores } from "./Provedores";
import "./globals.css";

/**
 * Fontes servidas pelo próprio app: o `next/font` baixa os arquivos no build
 * e os entrega do mesmo domínio. Antes era um `@import` do Google Fonts no
 * CSS, que bloqueava a renderização, vazava o IP do jogador para o Google a
 * cada visita e exigia liberar domínios externos na CSP.
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-ui",
});

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-pixel",
});

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
    <html lang="pt-BR" className={`${nunito.variable} ${pixel.variable}`}>
      <body>
        <Provedores>{children}</Provedores>
      </body>
    </html>
  );
}
