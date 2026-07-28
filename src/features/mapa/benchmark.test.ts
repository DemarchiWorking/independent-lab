import { describe, expect, it } from "vitest";
import { compararComBenchmark, eixoParaFocar, mensagemFoco } from "./benchmark";
import type { Atributos } from "@/lib/atributos";
import type { BenchmarkBairro } from "@/lib/db/types";

function atributos(vals: Partial<Record<keyof Atributos, number>>): Atributos {
  const base: Atributos = {
    tecnologia: { valor: 10, teto: 40 },
    processo: { valor: 10, teto: 40 },
    presenca: { valor: 10, teto: 40 },
    aquisicao: { valor: 10, teto: 40 },
    capacidade: { valor: 10, teto: 40 },
  };
  for (const [k, v] of Object.entries(vals)) base[k as keyof Atributos] = { ...base[k as keyof Atributos], valor: v! };
  return base;
}

function benchmark(medias: Partial<Record<keyof Atributos, number>>): BenchmarkBairro {
  return {
    totalNegocios: 5,
    medias: { tecnologia: 10, processo: 10, presenca: 10, aquisicao: 10, capacidade: 10, ...medias },
  };
}

describe("benchmark regional — comparação pura (GH-MAPA-04)", () => {
  it("compara cada eixo do negócio com a média do bairro", () => {
    const comparados = compararComBenchmark(atributos({ tecnologia: 15 }), benchmark({ tecnologia: 20 }));
    const tec = comparados.find((c) => c.chave === "tecnologia")!;
    expect(tec.seuValor).toBe(15);
    expect(tec.media).toBe(20);
  });

  it("eixoParaFocar é null quando o negócio está na média ou acima em tudo", () => {
    const comparados = compararComBenchmark(atributos({}), benchmark({}));
    expect(eixoParaFocar(comparados)).toBeNull();

    const acimaDeTudo = compararComBenchmark(atributos({ tecnologia: 20, processo: 20 }), benchmark({}));
    expect(eixoParaFocar(acimaDeTudo)).toBeNull();
  });

  it("eixoParaFocar escolhe o eixo com MAIOR distância abaixo da média", () => {
    const comparados = compararComBenchmark(
      atributos({ tecnologia: 8, presenca: 2 }), // tecnologia: -2, presenca: -8
      benchmark({}),
    );
    expect(eixoParaFocar(comparados)?.chave).toBe("presenca");
  });

  it("mensagemFoco nunca menciona outro negócio, só a ação sugerida", () => {
    const comparados = compararComBenchmark(atributos({ presenca: 2 }), benchmark({}));
    const eixo = eixoParaFocar(comparados)!;
    const msg = mensagemFoco(eixo);
    expect(msg).toContain("Presença");
    expect(msg).toContain("média do seu bairro");
    expect(msg).not.toMatch(/vizinho|concorrente|rival|melhor que/i);
  });

  it("mensagemFoco nunca reporta diferença zero ou negativa (só chamado quando há distância real)", () => {
    const comparados = compararComBenchmark(atributos({ presenca: 9 }), benchmark({}));
    const eixo = eixoParaFocar(comparados)!;
    expect(mensagemFoco(eixo)).toMatch(/^Você está \d+ pontos? abaixo/);
  });
});
