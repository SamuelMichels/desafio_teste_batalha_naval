import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida } from "../src/batalha-naval.js";
import { POSICOES, CASAS_OCUPADAS } from "../apoio/frota.js";

/** A mesma frota para os dois jogadores: o cenario fica simetrico e previsivel. */
const nova = () => new Partida({ frotas: [POSICOES, POSICOES] });

const ALVOS = CASAS_OCUPADAS.map((casa) => casa.split(",").map(Number));

/**
 * Casas garantidamente vazias nas duas frotas: as linhas 7, 6 e 4 nao aparecem
 * em CASAS_OCUPADAS. Servem para o jogador que precisa errar de proposito sem
 * repetir casa, porque o tiro repetido e recusado.
 */
const AGUA = [7, 6, 4].flatMap((y) => Array.from({ length: 10 }, (_, x) => [x, y]));

/** Afunda a frota inteira de quem nao e `poupado`, alternando a vez. */
const afundarTudoDe = (partida, poupado) => {
  let acertos = 0;
  let erros = 0;
  while (!partida.encerrado) {
    const [x, y] = partida.vez === poupado ? AGUA[erros++] : ALVOS[acertos++];
    partida.atirar(x, y);
  }
};

describe("partida de dois jogadores", () => {
  test("a partida comeca com a vez do jogador 0, sem vencedor", () => {
    const partida = nova();

    assert.equal(partida.vez, 0);
    assert.equal(partida.encerrado, false);
    assert.equal(partida.vencedor, null);
  });

  test("o tiro de um jogador cai no tabuleiro do adversario, nao no proprio", () => {
    const partida = nova();

    partida.atirar(0, 0);

    assert.equal(partida.tabuleiros[1].grade()[0][0].atingida, true);
    assert.equal(partida.tabuleiros[0].grade()[0][0].atingida, false);
  });

  test("o tiro passa a vez, inclusive quando acerta", () => {
    const partida = nova();

    assert.equal(partida.atirar(0, 0).resultado, "acerto");
    assert.equal(partida.vez, 1);

    assert.equal(partida.atirar(5, 5).resultado, "agua");
    assert.equal(partida.vez, 0);
  });

  test("o tiro diz quem atirou e em quem", () => {
    const partida = nova();

    assert.deepEqual(partida.atirar(5, 5), {
      jogador: 0,
      alvo: 1,
      resultado: "agua",
      navio: null,
    });
  });

  test("afundar a frota do adversario encerra a partida e da o vencedor", () => {
    const partida = nova();

    afundarTudoDe(partida, 1);

    assert.equal(partida.encerrado, true);
    assert.equal(partida.vencedor, 0);
    assert.equal(partida.tabuleiros[1].derrotado(), true);
    assert.equal(partida.tabuleiros[0].derrotado(), false);
  });

  test("o jogador 1 tambem pode ganhar", () => {
    const partida = nova();

    afundarTudoDe(partida, 0);

    assert.equal(partida.vencedor, 1);
  });

  test("a partida encerra no 14o acerto, nao antes", () => {
    const partida = nova();

    for (let i = 0; i < 13; i += 1) {
      const [x, y] = ALVOS[i];
      partida.atirar(x, y);
      partida.atirar(...AGUA[i]); // o adversario erra de proposito
      assert.equal(partida.encerrado, false);
    }

    const [x, y] = ALVOS[13];
    assert.equal(partida.atirar(x, y).resultado, "afundado");
    assert.equal(partida.encerrado, true);
  });
});

describe("partidas e tiros recusados", () => {
  test("nao se atira depois de a partida encerrar", () => {
    const partida = nova();
    afundarTudoDe(partida, 1);

    assert.throws(() => partida.atirar(1, 1), /partida encerrada/i);
  });

  test("a partida exige a frota completa dos dois jogadores", () => {
    const soUmNavio = [["destroier", 0, 0, "horizontal"]];

    assert.throws(() => new Partida({ frotas: [POSICOES, soUmNavio] }), /frota incompleta/i);
    assert.throws(() => new Partida({ frotas: [soUmNavio, POSICOES] }), /frota incompleta/i);
  });

  test("a partida exige exatamente dois jogadores", () => {
    assert.throws(() => new Partida({ frotas: [POSICOES] }), /dois jogadores/i);
    assert.throws(
      () => new Partida({ frotas: [POSICOES, POSICOES, POSICOES] }),
      /dois jogadores/i,
    );
  });

  test("o tiro repetido continua recusado dentro da partida", () => {
    const partida = nova();
    partida.atirar(5, 5);
    partida.atirar(5, 5); // o jogador 1 atirando no tabuleiro 0: casa diferente

    assert.throws(() => partida.atirar(5, 5), /ja recebeu tiro/i);
    assert.equal(partida.vez, 0, "a vez nao passa quando o tiro e recusado");
  });
});

describe("informacao oculta", () => {
  test("a visao do adversario nao revela navio que ainda nao foi atingido", () => {
    const partida = nova();

    const visao = partida.visaoDoAdversario(0);

    for (const linha of visao) {
      for (const casa of linha) {
        assert.deepEqual(casa, { navio: null, atingida: false });
      }
    }
  });

  test("a visao do adversario revela o navio na casa atingida, e so nela", () => {
    const partida = nova();
    partida.atirar(0, 0); // acerto no porta-avioes do jogador 1

    const visao = partida.visaoDoAdversario(0);

    assert.deepEqual(visao[0][0], { navio: "porta-avioes", atingida: true });
    assert.deepEqual(visao[0][1], { navio: null, atingida: false });
  });

  test("a agua atingida aparece como atingida e sem navio", () => {
    const partida = nova();
    partida.atirar(5, 5);

    assert.deepEqual(partida.visaoDoAdversario(0)[5][5], { navio: null, atingida: true });
  });

  test("o proprio tabuleiro continua visivel por inteiro para o dono", () => {
    const partida = nova();

    assert.equal(partida.tabuleiros[0].grade()[0][0].navio, "porta-avioes");
  });
});
