import { PitchNav } from "./sections/PitchNav";
import { PitchHero } from "./sections/PitchHero";
import { Problema } from "./sections/Problema";
import { Solucao } from "./sections/Solucao";
import { ProvaReal } from "./sections/ProvaReal";
import { CustoComparativo } from "./sections/CustoComparativo";
import { Tecnico } from "./sections/Tecnico";
import { AgentesIA } from "./sections/AgentesIA";
import { Mercado } from "./sections/Mercado";
import { Gamificacao } from "./sections/Gamificacao";
import { Equipe } from "./sections/Equipe";
import { PitchScript } from "./sections/PitchScript";
import { PitchCTA } from "./sections/PitchCTA";
import { PitchQRs } from "./sections/PitchQRs";
import { PitchFooter } from "./sections/PitchFooter";
import { ScrollProgress } from "./sections/ScrollProgress";
import { SectionNav } from "./sections/SectionNav";

/**
 * Pitch institucional (rota `/pitch`) — apresentação pro Sebrae Startup Win
 * (Ideação) e qualquer banca/investidor, distinta da landing (`/`, vende
 * cadastro pro empresário final). Composição pura de seções — copy vive em
 * `content.ts`, cada seção é um arquivo próprio em `sections/`.
 */
export function PitchPage() {
  return (
    <div className="pitch-scope relative min-h-screen bg-grain">
      <ScrollProgress />
      <SectionNav />
      <PitchNav />
      <PitchHero />
      <Problema />
      <Solucao />
      <ProvaReal />
      <CustoComparativo />
      <Tecnico />
      <AgentesIA />
      <Mercado />
      <Gamificacao />
      <Equipe />
      <PitchScript />
      <PitchCTA />
      <PitchQRs />
      <PitchFooter />
    </div>
  );
}
