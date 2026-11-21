/**
 * Batalha Naval de 10 x 10 com a frota de 4 navios, construida por TDD.
 *
 * As coordenadas sao (x, y): x e a coluna, de 0 a 9, e y e a linha, de 0 a 9.
 * A grade e indexada por grade[y][x], a mesma convencao usada no enunciado
 * quando ele fala em tabuleiro 10 x 10.
 */

export const LADO = 10;

/** Os quatro navios do enunciado, do maior para o menor. */
export const FROTA = [
  { nome: "porta-avioes", tamanho: 5 },
  { nome: "encouracado", tamanho: 4 },
  { nome: "submarino", tamanho: 3 },
  { nome: "destroier", tamanho: 2 },
];

/** 5 + 4 + 3 + 2: quantas das 100 casas a frota inteira ocupa. */
export const CASAS_DA_FROTA = FROTA.reduce((soma, navio) => soma + navio.tamanho, 0);

export class Tabuleiro {
  constructor() {
    this.casas = [];
    for (let y = 0; y < LADO; y += 1) {
      const linha = [];
      for (let x = 0; x < LADO; x += 1) {
        linha.push({ navio: null, atingida: false });
      }
      this.casas.push(linha);
    }

    /** nome do navio -> as casas que ele ocupa, na ordem em que foi posicionado. */
    this.navios = new Map();
  }

  /** Os nomes dos navios ja posicionados, na ordem em que entraram. */
  posicionados() {
    return [...this.navios.keys()];
  }

  /** Completo e com os quatro navios no tabuleiro: e o que libera o primeiro tiro. */
  completo() {
    return this.navios.size === FROTA.length;
  }

  /** Copia da grade: o chamador pode sujar o retorno sem alterar o tabuleiro. */
  grade() {
    return this.casas.map((linha) => linha.map((casa) => ({ ...casa })));
  }
}
