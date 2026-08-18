import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { Ticker } from "./sections/Ticker";
import { Stats } from "./sections/Stats";
import { Features } from "./sections/Features";
import { Documentos } from "./sections/Documentos";
import { Marketing } from "./sections/Marketing";
import { EscadaValor } from "./sections/EscadaValor";
import { CTAFinal } from "./sections/CTAFinal";
import { Footer } from "./sections/Footer";

/**
 * Landing de marketing do gamehub (GH-MKT-01), rota `/`. Composição pura de
 * seções — texto/dados vivem em `content.ts`, cada seção é um arquivo
 * próprio em `sections/`. Trocar copy, preço ou visual de UMA seção nunca
 * exige tocar nas outras.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Ticker />
      <Stats />
      <Features />
      <Documentos />
      <Marketing />
      <EscadaValor />
      <CTAFinal />
      <Footer />
    </div>
  );
}
