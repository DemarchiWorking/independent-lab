import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SEGMENTOS } from "@/features/mapa/segmentos";

/**
 * Trava a paridade entre o `Segmento` do TypeScript e o CHECK do Postgres.
 *
 * `SEGMENTOS` é `Record<Segmento, ...>` (`features/mapa/segmentos.ts`) — o
 * próprio TypeScript já exige exaustividade nesse objeto literal (adicionar
 * ou remover um valor de `Segmento` sem atualizar `SEGMENTOS` quebra o
 * `tsc --noEmit`). Por isso `Object.keys(SEGMENTOS)` é a lista de segmentos
 * mais confiável que existe em runtime — não precisa duplicar o union à mão.
 *
 * A migration `0014_segmento_icp.sql` existe porque esses dois lados
 * divergiram silenciosamente uma vez (M-1 do plano GH-OPS): o CHECK de
 * `0001_init.sql` tinha valores de um pivot de produto anterior, e 5 das 8
 * opções de cadastro — o ICP real — quebravam só em produção com Supabase,
 * nunca em `GAMEHUB_DB=file`. Este teste é o que impede a próxima divergência
 * de chegar tão longe sem ser notada.
 */
describe("segmento — paridade TypeScript ↔ Postgres", () => {
  const segmentosTs = Object.keys(SEGMENTOS).sort();

  const sqlPath = fileURLToPath(
    new URL("../../../supabase/migrations/0014_segmento_icp.sql", import.meta.url),
  );
  const sql = readFileSync(sqlPath, "utf8");

  /** Extrai a lista de valores do bloco `segmento in (...)` da migration. */
  function segmentosDoSql(): string[] {
    const match = sql.match(/segmento in \(([\s\S]*?)\)/);
    if (!match) {
      throw new Error(
        "Não achei `segmento in (...)` em 0014_segmento_icp.sql — a migration mudou de forma?",
      );
    }
    return match[1]
      .split(",")
      .map((v) => v.trim().replace(/^'|'$/g, ""))
      .filter(Boolean)
      .sort();
  }

  it("a migration 0014 existe e define o CHECK esperado", () => {
    expect(sql).toContain("negocios_segmento_check");
  });

  it("todo Segmento do TypeScript está no CHECK do Postgres", () => {
    const segmentosSql = segmentosDoSql();
    for (const s of segmentosTs) {
      expect(segmentosSql).toContain(s);
    }
  });

  it("o CHECK do Postgres não tem valor extra que o TypeScript não conhece", () => {
    const segmentosSql = segmentosDoSql();
    for (const s of segmentosSql) {
      expect(segmentosTs).toContain(s);
    }
  });

  it("as duas listas são exatamente iguais (mesmo tamanho, mesmos valores)", () => {
    expect(segmentosDoSql()).toEqual(segmentosTs);
  });

  it("é exatamente o ICP real — o motivo de M-1 existir", () => {
    expect(segmentosTs).toEqual(
      [
        "alimentacao",
        "comercio",
        "contabilidade",
        "engenharia",
        "outro",
        "saude",
        "servico",
        "tecnologia",
      ].sort(),
    );
  });
});
