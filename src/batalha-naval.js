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

const ORIENTACOES = ["horizontal", "vertical"];

const dentroDoTabuleiro = (indice) => Number.isInteger(indice) && indice >= 0 && indice < LADO;

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

  /**
   * Poe `nome` no tabuleiro a partir de (x, y), crescendo para a direita se
   * horizontal e para baixo se vertical.
   *
   * Todas as recusas sao conferidas antes de a primeira casa ser escrita: uma
   * tentativa recusada nao pode deixar meio navio no tabuleiro.
   */
  posicionar(nome, x, y, orientacao) {
    const navio = FROTA.find((candidato) => candidato.nome === nome);
    if (navio === undefined) {
      throw new Error(`O navio "${nome}" nao existe na frota.`);
    }
    if (this.navios.has(nome)) {
      throw new Error(`O navio "${nome}" ja esta posicionado.`);
    }
    if (!ORIENTACOES.includes(orientacao)) {
      throw new Error(`Orientacao invalida: "${orientacao}". Use "horizontal" ou "vertical".`);
    }
    if (!dentroDoTabuleiro(x) || !dentroDoTabuleiro(y)) {
      throw new Error(`A coordenada (${x}, ${y}) esta fora do tabuleiro.`);
    }

    const passo = orientacao === "horizontal" ? [1, 0] : [0, 1];
    const casas = Array.from({ length: navio.tamanho }, (_, i) => [
      x + passo[0] * i,
      y + passo[1] * i,
    ]);

    const [fimX, fimY] = casas[casas.length - 1];
    if (!dentroDoTabuleiro(fimX) || !dentroDoTabuleiro(fimY)) {
      throw new Error(
        `O ${nome} ocupa ${navio.tamanho} casas e nao cabe em (${x}, ${y}) na ${orientacao}.`,
      );
    }

    // Sobrepor e proibido; encostar nao e. O enunciado so lista os navios e o
    // tamanho do tabuleiro, e a regra classica do jogo proibe apenas ocupar a
    // mesma casa duas vezes.
    for (const [casaX, casaY] of casas) {
      const ocupante = this.casas[casaY][casaX].navio;
      if (ocupante !== null) {
        throw new Error(`A casa (${casaX}, ${casaY}) ja esta ocupada pelo ${ocupante}.`);
      }
    }

    for (const [casaX, casaY] of casas) {
      this.casas[casaY][casaX].navio = nome;
    }
    this.navios.set(nome, casas);
  }

  /**
   * Atira em (x, y) e diz o que aconteceu: "agua", "acerto" ou "afundado".
   * "afundado" e o acerto que completou o navio, e vem com o nome dele, para o
   * jogador saber o que caiu sem precisar olhar o tabuleiro inteiro.
   */
  atirar(x, y) {
    if (!this.completo()) {
      throw new Error(
        `Frota incompleta: ${this.navios.size} de ${FROTA.length} navios posicionados.`,
      );
    }
    if (!dentroDoTabuleiro(x) || !dentroDoTabuleiro(y)) {
      throw new Error(`A coordenada (${x}, ${y}) esta fora do tabuleiro.`);
    }

    const casa = this.casas[y][x];
    if (casa.atingida) {
      throw new Error(`A casa (${x}, ${y}) ja recebeu tiro.`);
    }

    casa.atingida = true;

    if (casa.navio === null) {
      return { resultado: "agua", navio: null };
    }
    return {
      resultado: this.#afundou(casa.navio) ? "afundado" : "acerto",
      navio: casa.navio,
    };
  }

  #afundou(nome) {
    return this.navios.get(nome).every(([x, y]) => this.casas[y][x].atingida);
  }

  /** Os navios com todas as casas atingidas. */
  afundados() {
    return this.posicionados().filter((nome) => this.#afundou(nome));
  }

  /** Derrotado e com os quatro navios afundados: a agua nunca derrota ninguem. */
  derrotado() {
    return this.afundados().length === FROTA.length;
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
