import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Tabuleiro, FROTA } from "../src/batalha-naval.js";
import { CASAS_OCUPADAS, comFrota } from "../apoio/frota.js";

describe("tiro: agua, acerto e afundado", () => {
  test("o tiro em casa vazia e agua e nao nomeia navio", () => {
    const tabuleiro = comFrota();

    assert.deepEqual(tabuleiro.atirar(5, 5), { resultado: "agua", navio: null });
  });

  test("o tiro em casa com navio e acerto e nomeia o navio", () => {
    const tabuleiro = comFrota();

    assert.deepEqual(tabuleiro.atirar(0, 0), { resultado: "acerto", navio: "porta-avioes" });
  });

  test("o tiro marca a casa como atingida, tanto na agua quanto no acerto", () => {
    const tabuleiro = comFrota();

    tabuleiro.atirar(5, 5);
    tabuleiro.atirar(0, 0);

    assert.equal(tabuleiro.grade()[5][5].atingida, true);
    assert.equal(tabuleiro.grade()[0][0].atingida, true);
    assert.equal(tabuleiro.grade()[1][1].atingida, false);
  });

  test("o ultimo tiro do navio e afundado, e os anteriores nao", () => {
    const tabuleiro = comFrota();

    assert.equal(tabuleiro.atirar(0, 8).resultado, "acerto");
    assert.deepEqual(tabuleiro.atirar(0, 9), { resultado: "afundado", navio: "destroier" });
  });

  test("afundar um navio nao afunda os outros", () => {
    const tabuleiro = comFrota();

    tabuleiro.atirar(0, 8);
    tabuleiro.atirar(0, 9);

    assert.deepEqual(tabuleiro.afundados(), ["destroier"]);
    assert.equal(tabuleiro.derrotado(), false);
  });

  test("o navio inteiro precisa ser atingido: faltando uma casa ele nao afunda", () => {
    const tabuleiro = comFrota();

    for (const [x, y] of [[0, 0], [1, 0], [2, 0], [3, 0]]) {
      assert.equal(tabuleiro.atirar(x, y).resultado, "acerto");
    }

    assert.deepEqual(tabuleiro.afundados(), []);
  });

  test("atingir as 14 casas da frota afunda os quatro navios e derrota o tabuleiro", () => {
    const tabuleiro = comFrota();

    for (const casa of CASAS_OCUPADAS) {
      const [x, y] = casa.split(",").map(Number);
      tabuleiro.atirar(x, y);
    }

    assert.deepEqual(tabuleiro.afundados().sort(), FROTA.map(({ nome }) => nome).sort());
    assert.equal(tabuleiro.derrotado(), true);
  });

  test("agua nenhuma derrota o tabuleiro, mesmo nas 86 casas vazias", () => {
    const tabuleiro = comFrota();

    for (let y = 0; y < 10; y += 1) {
      for (let x = 0; x < 10; x += 1) {
        if (!CASAS_OCUPADAS.includes(`${x},${y}`)) {
          assert.equal(tabuleiro.atirar(x, y).resultado, "agua");
        }
      }
    }

    assert.deepEqual(tabuleiro.afundados(), []);
    assert.equal(tabuleiro.derrotado(), false);
  });
});

describe("tiros recusados", () => {
  test("o tiro na mesma casa duas vezes e recusado", () => {
    const tabuleiro = comFrota();
    tabuleiro.atirar(5, 5);

    assert.throws(() => tabuleiro.atirar(5, 5), /ja recebeu tiro/i);
  });

  test("o tiro fora do tabuleiro e recusado", () => {
    const tabuleiro = comFrota();

    assert.throws(() => tabuleiro.atirar(10, 0), /fora do tabuleiro/i);
    assert.throws(() => tabuleiro.atirar(0, -1), /fora do tabuleiro/i);
  });

  test("nao se atira antes de a frota estar completa", () => {
    const tabuleiro = new Tabuleiro();
    tabuleiro.posicionar("destroier", 0, 0, "horizontal");

    assert.throws(() => tabuleiro.atirar(5, 5), /frota incompleta/i);
  });

  test("um tiro recusado nao altera nada na grade", () => {
    const tabuleiro = comFrota();
    tabuleiro.atirar(5, 5);
    const antes = tabuleiro.grade();

    assert.throws(() => tabuleiro.atirar(5, 5), /ja recebeu tiro/i);
    assert.throws(() => tabuleiro.atirar(10, 10), /fora do tabuleiro/i);

    assert.deepEqual(tabuleiro.grade(), antes);
  });
});
