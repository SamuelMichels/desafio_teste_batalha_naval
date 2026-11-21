import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Tabuleiro, FROTA, LADO, CASAS_DA_FROTA } from "../src/batalha-naval.js";

describe("tabuleiro 10 x 10 e a frota", () => {
  test("o tabuleiro tem 10 colunas e 10 linhas", () => {
    const tabuleiro = new Tabuleiro();

    assert.equal(LADO, 10);
    assert.equal(tabuleiro.grade().length, 10);
    for (const linha of tabuleiro.grade()) {
      assert.equal(linha.length, 10);
    }
  });

  test("a frota tem os quatro navios do enunciado, com os tamanhos 5, 4, 3 e 2", () => {
    assert.deepEqual(
      FROTA.map(({ nome, tamanho }) => [nome, tamanho]),
      [
        ["porta-avioes", 5],
        ["encouracado", 4],
        ["submarino", 3],
        ["destroier", 2],
      ],
    );
  });

  test("a frota ocupa 14 das 100 casas", () => {
    assert.equal(CASAS_DA_FROTA, 14);
    assert.equal(
      FROTA.reduce((soma, navio) => soma + navio.tamanho, 0),
      CASAS_DA_FROTA,
    );
  });

  test("toda casa comeca sem navio e sem tiro", () => {
    const tabuleiro = new Tabuleiro();

    for (const linha of tabuleiro.grade()) {
      for (const casa of linha) {
        assert.deepEqual(casa, { navio: null, atingida: false });
      }
    }
  });

  test("o tabuleiro comeca sem navio posicionado e incompleto", () => {
    const tabuleiro = new Tabuleiro();

    assert.deepEqual(tabuleiro.posicionados(), []);
    assert.equal(tabuleiro.completo(), false);
  });

  test("grade() devolve copia: sujar o retorno nao altera o tabuleiro", () => {
    const tabuleiro = new Tabuleiro();

    const copia = tabuleiro.grade();
    copia[0][0].navio = "porta-avioes";
    copia[0][0].atingida = true;

    assert.deepEqual(tabuleiro.grade()[0][0], { navio: null, atingida: false });
  });
});
