import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Tabuleiro, Partida, sortearFrota, FROTA, LADO, CASAS_DA_FROTA } from "../src/batalha-naval.js";

/** Reposiciona a frota sorteada num tabuleiro novo: se for invalida, isto estoura. */
const aceita = (posicoes) => {
  const tabuleiro = new Tabuleiro();
  for (const [nome, x, y, orientacao] of posicoes) {
    tabuleiro.posicionar(nome, x, y, orientacao);
  }
  return tabuleiro;
};

describe("sorteio da frota com semente", () => {
  test("a frota sorteada tem os quatro navios, uma vez cada", () => {
    const posicoes = sortearFrota(7);

    assert.deepEqual(
      posicoes.map(([nome]) => nome).sort(),
      FROTA.map(({ nome }) => nome).sort(),
    );
  });

  test("a mesma semente sorteia a mesma frota", () => {
    assert.deepEqual(sortearFrota(42), sortearFrota(42));
  });

  test("sementes diferentes sorteiam frotas diferentes", () => {
    assert.notDeepEqual(sortearFrota(1), sortearFrota(2));
  });

  test("a frota sorteada e sempre valida: cabe, nao sobrepoe e ocupa 14 casas", () => {
    for (let semente = 0; semente < 200; semente += 1) {
      const tabuleiro = aceita(sortearFrota(semente));

      assert.equal(tabuleiro.completo(), true, `semente ${semente}`);
      const ocupadas = tabuleiro
        .grade()
        .flat()
        .filter((casa) => casa.navio !== null).length;
      assert.equal(ocupadas, CASAS_DA_FROTA, `semente ${semente}`);
    }
  });

  test("toda orientacao sorteada e horizontal ou vertical, e toda coordenada cabe", () => {
    for (let semente = 0; semente < 50; semente += 1) {
      for (const [nome, x, y, orientacao] of sortearFrota(semente)) {
        assert.ok(["horizontal", "vertical"].includes(orientacao), `${nome} ${orientacao}`);
        assert.ok(x >= 0 && x < LADO && y >= 0 && y < LADO, `${nome} (${x}, ${y})`);
      }
    }
  });

  test("a partida aceita semente em vez de frota, e as duas frotas saem diferentes", () => {
    const partida = new Partida({ semente: 2026 });

    assert.equal(partida.tabuleiros[0].completo(), true);
    assert.equal(partida.tabuleiros[1].completo(), true);
    assert.notDeepEqual(partida.tabuleiros[0].grade(), partida.tabuleiros[1].grade());
  });

  test("a mesma semente reproduz a partida inteira", () => {
    assert.deepEqual(
      new Partida({ semente: 99 }).tabuleiros[0].grade(),
      new Partida({ semente: 99 }).tabuleiros[0].grade(),
    );
  });

  test("a partida sem frota e sem semente e recusada", () => {
    assert.throws(() => new Partida(), /frota ou semente/i);
    assert.throws(() => new Partida({}), /frota ou semente/i);
  });
});
