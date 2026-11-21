import { Tabuleiro } from "../src/batalha-naval.js";

/**
 * Uma frota legitima: os quatro navios dentro do tabuleiro, sem sobreposicao.
 * Serve de ponto de partida para todo cenario que precisa do tabuleiro pronto
 * para receber tiro, sem repetir as quatro chamadas em cada caso de teste.
 *
 * Cada item e [nome, x, y, orientacao], como `posicionar` recebe.
 */
export const POSICOES = [
  ["porta-avioes", 0, 0, "horizontal"],
  ["encouracado", 9, 0, "vertical"],
  ["submarino", 2, 5, "horizontal"],
  ["destroier", 0, 8, "vertical"],
];

/** As 14 casas que POSICOES ocupa, como "x,y", para conferir acerto e agua. */
export const CASAS_OCUPADAS = [
  "0,0", "1,0", "2,0", "3,0", "4,0",
  "9,0", "9,1", "9,2", "9,3",
  "2,5", "3,5", "4,5",
  "0,8", "0,9",
];

/** Um tabuleiro com a frota de POSICOES ja posicionada. */
export const comFrota = (posicoes = POSICOES) => {
  const tabuleiro = new Tabuleiro();
  for (const [nome, x, y, orientacao] of posicoes) {
    tabuleiro.posicionar(nome, x, y, orientacao);
  }
  return tabuleiro;
};
