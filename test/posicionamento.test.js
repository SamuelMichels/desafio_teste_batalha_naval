import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Tabuleiro, CASAS_DA_FROTA } from "../src/batalha-naval.js";
import { POSICOES, CASAS_OCUPADAS, comFrota } from "../apoio/frota.js";

/** As casas com navio, como "x,y", lidas so pela grade publica. */
const ocupadasDe = (tabuleiro) => {
  const ocupadas = [];
  tabuleiro.grade().forEach((linha, y) => {
    linha.forEach((casa, x) => {
      if (casa.navio !== null) {
        ocupadas.push(`${x},${y}`);
      }
    });
  });
  return ocupadas;
};

describe("posicionar os navios", () => {
  test("o navio horizontal ocupa as casas a direita da coordenada", () => {
    const tabuleiro = new Tabuleiro();

    tabuleiro.posicionar("porta-avioes", 3, 7, "horizontal");

    assert.deepEqual(ocupadasDe(tabuleiro), ["3,7", "4,7", "5,7", "6,7", "7,7"]);
    assert.deepEqual(tabuleiro.posicionados(), ["porta-avioes"]);
  });

  test("o navio vertical ocupa as casas abaixo da coordenada", () => {
    const tabuleiro = new Tabuleiro();

    tabuleiro.posicionar("submarino", 4, 2, "vertical");

    assert.deepEqual(ocupadasDe(tabuleiro), ["4,2", "4,3", "4,4"]);
  });

  test("a casa ocupada guarda o nome do navio", () => {
    const tabuleiro = new Tabuleiro();

    tabuleiro.posicionar("destroier", 6, 6, "horizontal");

    assert.equal(tabuleiro.grade()[6][6].navio, "destroier");
    assert.equal(tabuleiro.grade()[6][7].navio, "destroier");
    assert.equal(tabuleiro.grade()[6][8].navio, null);
  });

  test("a frota inteira ocupa as 14 casas e completa o tabuleiro", () => {
    const tabuleiro = comFrota();

    assert.deepEqual(ocupadasDe(tabuleiro).sort(), [...CASAS_OCUPADAS].sort());
    assert.equal(ocupadasDe(tabuleiro).length, CASAS_DA_FROTA);
    assert.equal(tabuleiro.completo(), true);
    assert.deepEqual(tabuleiro.posicionados(), POSICOES.map(([nome]) => nome));
  });

  test("navios encostados sao aceitos: o enunciado proibe sobrepor, nao vizinhar", () => {
    const tabuleiro = new Tabuleiro();

    tabuleiro.posicionar("destroier", 0, 0, "horizontal");
    tabuleiro.posicionar("submarino", 2, 0, "horizontal");

    assert.deepEqual(ocupadasDe(tabuleiro), ["0,0", "1,0", "2,0", "3,0", "4,0"]);
  });
});

describe("posicionamentos recusados", () => {
  test("o navio que passa da ultima coluna e recusado", () => {
    const tabuleiro = new Tabuleiro();

    assert.throws(() => tabuleiro.posicionar("porta-avioes", 6, 0, "horizontal"), /nao cabe/i);
    assert.deepEqual(tabuleiro.posicionados(), []);
  });

  test("o navio que passa da ultima linha e recusado", () => {
    const tabuleiro = new Tabuleiro();

    assert.throws(() => tabuleiro.posicionar("encouracado", 0, 7, "vertical"), /nao cabe/i);
  });

  test("a coordenada fora do tabuleiro e recusada", () => {
    const tabuleiro = new Tabuleiro();

    assert.throws(() => tabuleiro.posicionar("destroier", -1, 0, "horizontal"), /fora do tabuleiro/i);
    assert.throws(() => tabuleiro.posicionar("destroier", 0, 10, "horizontal"), /fora do tabuleiro/i);
    assert.throws(() => tabuleiro.posicionar("destroier", 1.5, 0, "horizontal"), /fora do tabuleiro/i);
    assert.deepEqual(tabuleiro.posicionados(), []);
  });

  test("o navio que sobrepoe outro e recusado", () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar("porta-avioes", 0, 0, "horizontal");

    assert.throws(() => tabuleiro.posicionar("submarino", 4, 0, "vertical"), /ocupada/i);
    assert.deepEqual(tabuleiro.posicionados(), ["porta-avioes"]);
  });

  test("o navio ja posicionado nao entra duas vezes", () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar("submarino", 0, 0, "horizontal");

    assert.throws(() => tabuleiro.posicionar("submarino", 0, 5, "horizontal"), /ja esta posicionado/i);
  });

  test("o navio que nao existe na frota e recusado", () => {
    const tabuleiro = new Tabuleiro();

    assert.throws(() => tabuleiro.posicionar("fragata", 0, 0, "horizontal"), /nao existe na frota/i);
  });

  test("a orientacao que nao e horizontal nem vertical e recusada", () => {
    const tabuleiro = new Tabuleiro();

    assert.throws(() => tabuleiro.posicionar("destroier", 0, 0, "diagonal"), /orientacao/i);
  });

  test("um posicionamento recusado nao altera nada na grade", () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar("porta-avioes", 0, 0, "horizontal");
    const antes = tabuleiro.grade();

    assert.throws(() => tabuleiro.posicionar("submarino", 2, 0, "vertical"), /ocupada/i);

    assert.deepEqual(tabuleiro.grade(), antes);
  });
});
