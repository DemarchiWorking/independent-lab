/**
 * `pixi.js/unsafe-eval` é importado só pelo efeito colateral (troca o código
 * gerado com `new Function` por uma versão compatível com CSP). O pacote não
 * aponta tipos para esse subcaminho; o módulo é declarado vazio, sem `any`.
 */
declare module "pixi.js/unsafe-eval" {
  export {};
}
