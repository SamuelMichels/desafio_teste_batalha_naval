import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida, FROTA, LADO, CASAS_DA_FROTA } from "../src/batalha-naval.js";

const TAMANHO = new Map(FROTA.map(({ nome, tamanho }) => [nome, tamanho]));

const VIZINHAS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const dentro = (x, y) => x >= 0 && x < LADO && y >= 0 && y < LADO;

/**
 * Os navios que a visao ja mostra inteiros. Sai da visao publica: o numero de
 * casas atingidas com aquele nome chegou ao tamanho do navio, e o tamanho esta
 * no enunciado. O cacador nao precisa de nenhum acesso privilegiado para saber
 * o que ja afundou.
 */
const afundadosNaVisao = (visao) => {
  const atingidas = new Map();
  for (const linha of visao) {
    for (const casa of linha) {
      if (casa.navio !== null) {
        atingidas.set(casa.navio, (atingidas.get(casa.navio) ?? 0) + 1);
      }
    }
  }
  return [...atingidas].filter(([nome, quantas]) => quantas === TAMANHO.get(nome)).map(([nome]) => nome);
};

/**
 * O proximo tiro do cacador, olhando so a visao do adversario.
 *
 * Duas etapas, na ordem: perseguir o navio ferido (vizinha intacta de um acerto
 * cujo navio ainda nao afundou) e, quando nao ha ferido, varrer as casas de
 * paridade par. A varredura por paridade basta porque o menor navio ocupa duas
 * casas, e todo par de casas vizinhas contem uma de paridade par — nenhum navio
 * consegue se esconder nas casas impares.
 */
const proximoTiro = (visao) => {
  const afundados = afundadosNaVisao(visao);

  for (let y = 0; y < LADO; y += 1) {
    for (let x = 0; x < LADO; x += 1) {
      const casa = visao[y][x];
      if (casa.navio === null || afundados.includes(casa.navio)) {
        continue;
      }
      for (const [dx, dy] of VIZINHAS) {
        const [vx, vy] = [x + dx, y + dy];
        if (dentro(vx, vy) && !visao[vy][vx].atingida) {
          return { x: vx, y: vy, motivo: "perseguir" };
        }
      }
    }
  }

  for (const paridade of [0, 1]) {
    for (let y = 0; y < LADO; y += 1) {
      for (let x = 0; x < LADO; x += 1) {
        if ((x + y) % 2 === paridade && !visao[y][x].atingida) {
          return { x, y, motivo: paridade === 0 ? "varrer" : "varrer-impar" };
        }
      }
    }
  }

  return null;
};

/** Quantas casas da visao ja receberam tiro. */
const atingidasNaVisao = (visao) => visao.flat().filter((casa) => casa.atingida).length;

/**
 * Cinco invariantes conferidos depois de cada tiro da partida, todos lidos pela
 * API publica.
 */
const conferirInvariantes = (partida, tiros, onde) => {
  for (const jogador of [0, 1]) {
    const visao = partida.visaoDoAdversario(jogador);

    // 1. A visao nunca revela navio intacto: casa com navio implica atingida.
    for (const linha of visao) {
      for (const casa of linha) {
        if (casa.navio !== null) {
          assert.equal(casa.atingida, true, `${onde}: navio visivel sem tiro`);
        }
      }
    }

    // 2. A visao mostra exatamente os tiros que aquele jogador deu.
    assert.equal(atingidasNaVisao(visao), tiros[jogador], `${onde}: tiros x casas atingidas`);

    // 3. A visao nunca mostra mais casas de um navio do que ele tem.
    const porNavio = new Map();
    for (const casa of visao.flat()) {
      if (casa.navio !== null) {
        porNavio.set(casa.navio, (porNavio.get(casa.navio) ?? 0) + 1);
      }
    }
    for (const [nome, quantas] of porNavio) {
      assert.ok(quantas <= TAMANHO.get(nome), `${onde}: ${nome} com ${quantas} casas`);
    }
  }

  // 4. Encerrada se e somente se algum tabuleiro esta derrotado.
  const algumDerrotado = partida.tabuleiros.some((tabuleiro) => tabuleiro.derrotado());
  assert.equal(partida.encerrado, algumDerrotado, `${onde}: encerrado x derrotado`);

  // 5. O vencedor existe exatamente quando a partida encerrou, e e quem nao perdeu.
  if (partida.encerrado) {
    assert.ok([0, 1].includes(partida.vencedor), `${onde}: vencedor invalido`);
    assert.equal(partida.tabuleiros[1 - partida.vencedor].derrotado(), true, `${onde}: perdedor`);
  } else {
    assert.equal(partida.vencedor, null, `${onde}: vencedor antes do fim`);
  }
};

/** Joga a partida inteira com os dois jogadores cacando, e devolve o historico. */
const jogar = (semente) => {
  const partida = new Partida({ semente });
  const tiros = [0, 0];
  const porMotivo = { perseguir: 0, varrer: 0, "varrer-impar": 0 };
  const resultados = { agua: 0, acerto: 0, afundado: 0 };

  while (!partida.encerrado) {
    const jogador = partida.vez;
    const alvo = proximoTiro(partida.visaoDoAdversario(jogador));
    assert.notEqual(alvo, null, `jogador ${jogador} sem tiro possivel`);

    const tiro = partida.atirar(alvo.x, alvo.y);
    assert.equal(tiro.jogador, jogador);

    tiros[jogador] += 1;
    porMotivo[alvo.motivo] += 1;
    resultados[tiro.resultado] += 1;

    conferirInvariantes(partida, tiros, `tiro ${tiros[0] + tiros[1]}`);
    assert.ok(tiros[0] + tiros[1] <= 2 * LADO * LADO, "a partida nao termina");
  }

  return { partida, tiros, porMotivo, resultados };
};

describe("partida completa cacada do inicio ao fim", () => {
  test("a partida termina, com um vencedor e o adversario com a frota afundada", () => {
    const { partida } = jogar(2026);

    assert.equal(partida.encerrado, true);
    assert.ok([0, 1].includes(partida.vencedor));
    assert.deepEqual(
      partida.tabuleiros[1 - partida.vencedor].afundados().sort(),
      FROTA.map(({ nome }) => nome).sort(),
    );
  });

  test("o vencedor acertou as 14 casas da frota inimiga, nem uma a mais", () => {
    const { partida } = jogar(2026);

    const visao = partida.visaoDoAdversario(partida.vencedor);
    const acertos = visao.flat().filter((casa) => casa.navio !== null).length;

    assert.equal(acertos, CASAS_DA_FROTA);
  });

  test("cada resultado afundado corresponde a um navio afundado nos tabuleiros", () => {
    const { partida, resultados } = jogar(2026);

    const afundadosNosDois =
      partida.tabuleiros[0].afundados().length + partida.tabuleiros[1].afundados().length;

    assert.equal(resultados.afundado, afundadosNosDois);
    assert.equal(partida.tabuleiros[1 - partida.vencedor].afundados().length, FROTA.length);
  });

  test("o perdedor nao chegou a afundar a frota do vencedor", () => {
    const { partida } = jogar(2026);

    assert.equal(partida.tabuleiros[partida.vencedor].derrotado(), false);
  });

  test("a mesma semente joga a mesma partida, tiro por tiro", () => {
    const primeira = jogar(7);
    const segunda = jogar(7);

    assert.deepEqual(primeira.tiros, segunda.tiros);
    assert.deepEqual(primeira.porMotivo, segunda.porMotivo);
    assert.deepEqual(primeira.resultados, segunda.resultados);
    assert.equal(primeira.partida.vencedor, segunda.partida.vencedor);
  });

  test("dez sementes diferentes: toda partida termina e os invariantes se mantem", () => {
    for (let semente = 1; semente <= 10; semente += 1) {
      const { partida, tiros } = jogar(semente);

      assert.equal(partida.encerrado, true, `semente ${semente}`);
      assert.ok(tiros[0] >= CASAS_DA_FROTA, `semente ${semente}: poucos tiros do vencedor`);
    }
  });

  test("as duas etapas do cacador sao exercitadas, e a varredura impar nao e necessaria", () => {
    const { porMotivo, tiros } = jogar(2026);

    // Numeros medidos na propria suite, nao escolhidos. Se a perseguicao parar
    // de ser usada (ou passar a decidir tudo), este caso acusa; e se a varredura
    // impar algum dia for necessaria, ela deixa de ser zero e o caso tambem
    // acusa, porque a paridade par deveria bastar para achar todo navio.
    assert.deepEqual(porMotivo, { perseguir: 47, varrer: 53, "varrer-impar": 0 });
    assert.deepEqual(tiros, [50, 50]);
  });
});
