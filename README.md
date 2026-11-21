# desafio_teste_batalha_naval

Casos de teste em JavaScript para uma Batalha Naval de tabuleiro **10 × 10** com
a frota de quatro navios do enunciado, construída por **TDD**: nenhuma linha de
modelo foi escrita antes de um caso de teste falhar por falta dela.

## Colaborador

| Colaborador | RA | Contribuição |
| --- | --- | --- |
| Samuel Fuentes Michels | 24011114-2 | trabalho individual: especificação, modelo, casos de teste e teste de mutação |

Trabalho individual — não houve dupla. O histórico de commits do repositório
registra a contribuição ciclo por ciclo.

## Como executar

```bash
node --test
```

Sem instalar nada: a suíte usa só o executor de testes nativo do Node
(`node:test` + `node:assert/strict`). Requer **Node 18+** (desenvolvido no
Node 22). Saída esperada:

```
# tests 61
# suites 10
# pass 61
# fail 0
```

---

## 1. Especificação

O enunciado do desafio é curto:

> **Batalha Naval (by Cayque)** — casos de teste para testar tabuleiro 10 × 10;
> 1 Porta-aviões (ocupa 5 casas), 1 Encouraçado (ocupa 4 casas), 1 Submarino
> (ocupa 3 casas), 1 Destroier ou Hidroavião (ocupa 2 casas); casos de teste em
> Javascript para testar Javascript.

O que segue é a especificação completa do que foi modelado e testado. Onde o
enunciado é omisso, a decisão está registrada na seção 1.8, porque uma regra
escolhida por mim não pode passar por regra do enunciado.

### 1.1 O tabuleiro

- 10 colunas × 10 linhas = **100 casas**.
- A coordenada é **(x, y)**: `x` é a coluna (0 a 9) e `y` é a linha (0 a 9). A
  grade é indexada por `grade[y][x]`.
- Cada casa tem dois atributos: `navio` (o nome do navio que a ocupa, ou `null`)
  e `atingida` (se já recebeu tiro).
- Toda casa começa `{ navio: null, atingida: false }`.

### 1.2 A frota

| Navio | Casas |
| --- | --- |
| `porta-avioes` | 5 |
| `encouracado` | 4 |
| `submarino` | 3 |
| `destroier` | 2 |

São **14 das 100 casas** ocupadas — 14 % do tabuleiro. Cada navio aparece
**uma vez só**: a frota é fixa, não configurável.

### 1.3 Posicionamento

`posicionar(nome, x, y, orientacao)` põe um navio a partir de (x, y), crescendo
**para a direita** se `"horizontal"` e **para baixo** se `"vertical"`.

Um navio de 5 casas posicionado em (3, 7) na horizontal ocupa
(3,7) (4,7) (5,7) (6,7) (7,7).

As seis recusas, todas com mensagem própria:

| Situação | Mensagem (trecho) |
| --- | --- |
| nome que não está na frota | `O navio "fragata" nao existe na frota.` |
| navio já posicionado | `O navio "submarino" ja esta posicionado.` |
| orientação que não é horizontal nem vertical | `Orientacao invalida: "diagonal". Use "horizontal" ou "vertical".` |
| coordenada fora do tabuleiro, ou não inteira | `A coordenada (-1, 0) esta fora do tabuleiro.` |
| navio que passaria da borda | `O porta-avioes ocupa 5 casas e nao cabe em (6, 0) na horizontal.` |
| casa já ocupada por outro navio | `A casa (4, 0) ja esta ocupada pelo porta-avioes.` |

**Toda recusa é atômica**: as seis condições são conferidas antes de a primeira
casa ser escrita, então uma tentativa recusada nunca deixa meio navio no
tabuleiro. Há um caso de teste só para isso.

O tabuleiro fica **completo** quando os quatro navios estão posicionados, e é
isso que libera o primeiro tiro.

### 1.4 O tiro

`atirar(x, y)` devolve `{ resultado, navio }`:

| `resultado` | Quando | `navio` |
| --- | --- | --- |
| `"agua"` | a casa não tinha navio | `null` |
| `"acerto"` | a casa tinha navio, e ele ainda tem casa intacta | o nome do navio |
| `"afundado"` | este tiro completou o navio | o nome do navio |

`"afundado"` é o acerto que fechou o navio — não existe tiro que devolva
`"afundado"` sem ter acertado. As três recusas:

| Situação | Mensagem (trecho) |
| --- | --- |
| frota ainda incompleta | `Frota incompleta: 1 de 4 navios posicionados.` |
| coordenada fora do tabuleiro | `A coordenada (10, 0) esta fora do tabuleiro.` |
| casa que já recebeu tiro | `A casa (5, 5) ja recebeu tiro.` |

`afundados()` lista os navios com todas as casas atingidas, e `derrotado()` é
verdadeiro quando os **quatro** afundaram. Atirar nas 86 casas de água não
derrota ninguém — há um caso de teste que atira em todas elas.

### 1.5 A partida de dois jogadores

Cada jogador tem o seu tabuleiro e atira **no tabuleiro do adversário**.

- A partida começa na **vez do jogador 0**.
- Cada tiro **passa a vez**, inclusive quando acerta (ver 1.8).
- Um tiro recusado pelo tabuleiro (casa repetida, coordenada fora) sobe como
  erro e **não consome a vez**: errar a chamada não custa o turno.
- A partida **encerra** no tiro que afunda o último navio do adversário, e o
  **vencedor** é quem atirou.
- Depois de encerrada, `atirar` é recusado: `Partida encerrada: o jogador 0 ganhou.`
- A construção exige **dois** jogadores, cada um com a **frota completa**.

### 1.6 Informação oculta

`visaoDoAdversario(jogador)` é o que aquele jogador sabe do tabuleiro inimigo:

- casa **atingida** aparece como está — revela se havia navio e qual;
- casa **intacta** aparece como `{ navio: null, atingida: false }`, **mesmo
  quando tem navio**.

É o que torna o jogo um jogo: a frota inimiga não pode ser lida do tabuleiro.
O próprio tabuleiro continua inteiramente visível para o dono.

### 1.7 Sorteio reproduzível

`sortearFrota(semente)` devolve uma frota válida, e `new Partida({ semente })`
sorteia as duas. O gerador é o **mulberry32** com semente, e não `Math.random`:
um tabuleiro sorteado sem semente tornaria irrepetível qualquer caso de teste
que dependesse dele.

O sorteio tenta uma coordenada por vez e deixa o próprio `posicionar` dizer se
ela serve. Assim existe **uma única definição** de frota válida no código, e o
sorteio não pode discordar da regra que os casos de teste cobram.

As duas frotas da partida saem de sementes **vizinhas** (`semente` e
`semente + 1`): se as duas usassem a mesma, os dois jogadores teriam a frota
idêntica, e um cenário simétrico esconderia o erro de trocar os tabuleiros.

### 1.8 Onde o enunciado é omisso, e o que eu decidi

| Questão | Decisão | Por quê |
| --- | --- | --- |
| Navios podem **encostar**? | **Sim.** Só sobrepor é proibido. | O enunciado lista a frota e o tamanho do tabuleiro, nada mais; a regra clássica proíbe apenas ocupar a mesma casa duas vezes. |
| Acerto dá **tiro extra**? | **Não.** A vez passa a cada tiro. | A alternância simples é a regra clássica. A variante com tiro extra existe, mas descrevê-la seria pôr no README uma regra que o enunciado não pede. |
| Diagonal? | **Não.** Só horizontal e vertical. | Idem — e a orientação diagonal é recusada com mensagem própria. |
| Quem começa? | **Jogador 0**, sempre. | Sorteio de quem começa só acrescentaria aleatoriedade sem acrescentar regra testável. |

---

## 2. O modelo testado

Um arquivo, duas classes, zero dependências.

| Exportado | O que é |
| --- | --- |
| `LADO` | 10 |
| `FROTA` | os quatro navios, com nome e tamanho |
| `CASAS_DA_FROTA` | 14, calculado da `FROTA` e não digitado |
| `Tabuleiro` | um tabuleiro: posicionar, atirar, afundados, derrotado, grade |
| `Partida` | dois tabuleiros, a vez, o vencedor e a visão do adversário |
| `sortearFrota(semente)` | uma frota válida, reproduzível |

### Duas decisões tomadas para o modelo ser testável

**O sorteio recebe semente, não usa `Math.random`.** Sem isso, nenhum caso de
teste que dependa da frota sorteada roda igual duas vezes, e um caso que falha
uma vez em dez não é um caso de teste, é um boato.

**O tiro devolve o resultado em vez de só alterar o estado.** `atirar` responde
`{ resultado, navio }`, então o caso de teste confere a consequência do tiro
sem ter que inferi-la varrendo a grade — e o jogador também não precisa.

### Por que `apoio/` fica fora de `test/`

`node --test` trata **todo** arquivo dentro de `test/` como arquivo de teste. Um
`test/apoio.js` com os helpers seria executado como suíte vazia e apareceria no
relatório. Por isso os helpers compartilhados (`POSICOES`, `CASAS_OCUPADAS`,
`comFrota`) vivem em [apoio/frota.js](apoio/frota.js).

---

## 3. Como funcionam os casos de teste

**62 casos em 10 suítes, 776 linhas de teste para 285 de modelo.**

| Arquivo | Casos | O que examina |
| --- | --- | --- |
| [test/tabuleiro.test.js](test/tabuleiro.test.js) | 6 | as 100 casas, a frota do enunciado, o estado inicial |
| [test/posicionamento.test.js](test/posicionamento.test.js) | 14 | onde cada navio cai, e as seis recusas |
| [test/tiro.test.js](test/tiro.test.js) | 12 | água, acerto, afundado, derrota, e as três recusas |
| [test/partida.test.js](test/partida.test.js) | 15 | a vez, o vencedor, e a informação oculta |
| [test/sorteio.test.js](test/sorteio.test.js) | 8 | a frota sorteada é válida e reproduzível |
| [test/partida-completa.test.js](test/partida-completa.test.js) | 7 | uma partida inteira caçada pelos dois jogadores |

### 3.1 As quatro formas de examinar

**Caso de exemplo.** A maioria: monta uma situação, executa uma operação,
confere o resultado. `atirar(0, 0)` na casa do porta-aviões devolve `"acerto"`.

**Caso de recusa.** Nove ao todo, um por mensagem de erro. Todos usam
`assert.throws` com uma expressão regular, nunca `assert.throws` sem padrão: um
caso que aceita qualquer erro passa quando o modelo estoura pelo motivo errado.

**Caso exaustivo.** Onde o espaço é pequeno o bastante para varrer inteiro, ele
é varrido inteiro — e não amostrado:

- as **14 casas** da frota, para conferir que atirar em todas afunda os quatro navios;
- as **86 casas de água**, para conferir que nenhuma afunda nada;
- as **200 sementes**, para conferir que o sorteio nunca produz frota inválida.

**Teste de integração.** O último arquivo joga a partida do começo ao fim, com
os dois jogadores caçando. O caçador olha **apenas** `visaoDoAdversario`, em
duas etapas:

1. **perseguir** — se existe acerto cujo navio ainda não afundou, atira numa
   casa vizinha intacta;
2. **varrer** — sem navio ferido, atira na próxima casa de paridade par.

Ele deduz o que já afundou contando, na visão pública, as casas atingidas com
cada nome e comparando com o tamanho que está no enunciado. **Nenhum acesso
privilegiado**: se a partida termina, está provado que a API pública é
suficiente para jogar o jogo de verdade, e não só para ser consultada.

A varredura por paridade par basta porque o menor navio ocupa 2 casas, e todo
par de casas vizinhas contém uma de paridade par — nenhum navio consegue se
esconder nas casas ímpares. A suíte **mede** isso: `varrer-impar` ficou em **0**
e está fixado num caso, então se algum dia a paridade par deixar de bastar, o
caso acusa.

Depois de **cada tiro** da partida, cinco invariantes são conferidos:

1. a visão nunca mostra navio em casa intacta (a frota inimiga não vaza);
2. as casas atingidas na visão são exatamente os tiros que aquele jogador deu;
3. a visão nunca mostra mais casas de um navio do que o navio tem;
4. `encerrado` é verdadeiro **se e somente se** algum tabuleiro está derrotado;
5. o vencedor existe exatamente quando a partida acabou, e é quem não perdeu.

### 3.2 A prova de que os casos pegam defeito

Um caso de teste verde não prova nada sozinho: prova que o código passa, não
que o caso detectaria um defeito. Aqui a detecção foi medida de duas formas.

#### Os 7 ciclos de TDD: o vermelho antes do verde

Nenhuma linha de modelo foi escrita antes de um caso falhar por falta dela. O
que cada ciclo mediu no RED:

| Ciclo | Casos novos | Falharam no RED | Como falhou |
| --- | --- | --- | --- |
| 1 — tabuleiro e frota | 6 | 6 | `ERR_MODULE_NOT_FOUND`: o `src/` não existia |
| 2 — posicionamento | 13 | 13 | `posicionar is not a function` |
| 3 — tiro | 12 | 12 | `atirar is not a function` |
| 4 — partida de 2 jogadores | 15 | 15 | o módulo não exportava `Partida` |
| 5 — sorteio com semente | 8 | 8 | o módulo não exportava `sortearFrota` |
| 6 — partida completa | 7 | 2 | ver abaixo |
| 7 — frota de três navios | 1 | 0 | ver abaixo |
| **Total** | **62** | **56** | |

Nos ciclos 1, 4 e 5 o arquivo **nem carregou** (import ou export inexistente),
então nenhum dos casos daquele ciclo chegou a rodar — é o vermelho mais honesto
que existe, mas vale registrar que foi falha de carga e não de asserção.

O **ciclo 6** não acrescentou modelo: é um teste de integração sobre a API que
os cinco ciclos anteriores já tinham construído, então 5 dos 7 casos passaram
de primeira. Os 2 que falharam falharam **de propósito** — eu afirmei valores
deliberadamente errados para a própria execução imprimir a medida real (quantos
tiros, quantos por etapa do caçador) e só então fixei o número medido. Um desses
dois revelou uma premissa minha errada: eu esperava 4 resultados `"afundado"` na
partida e saíram 7, porque o **perdedor também afunda navios** antes de perder.
O caso foi reescrito para o invariante de verdade (`"afundado"` contados ==
navios afundados nos dois tabuleiros) em vez do número mágico.

O **ciclo 7** é o caso que o teste de mutação cobrou, e não passa de vermelho
porque o modelo já estava correto — ele fecha lacuna de **caso de teste**, não
defeito de modelo. A prova de que ele detecta está na seção seguinte: o mutante
que sobrevivia morre com ele.

#### Teste de mutação: 17 defeitos plantados, 17 mortos

Cada mutante é **uma** alteração mínima no `src/`, com a suíte inteira rodando
em cima. Mutante morto = algum caso de teste pegou.

| # | Defeito plantado | Resultado |
| --- | --- | --- |
| M1 | índice do tabuleiro aceita o 10 | morto (5 falhas) |
| M2 | coordenada não precisa ser inteira | morto (1 falha) |
| M3 | horizontal e vertical trocados | morto (35 falhas) |
| M4 | navio ocupa uma casa menos | morto (14 falhas) |
| M5 | navio pode passar da borda | morto (2 falhas) |
| M6 | sobreposição permitida | morto (4 falhas) |
| M7 | navio posicionado duas vezes | morto (1 falha) |
| M8 | completo com três navios | **sobreviveu** → morto depois do ciclo 7 |
| M9 | afunda com um acerto só (`every` → `some`) | morto (8 falhas) |
| M10 | o tiro não marca a casa | morto (21 falhas) |
| M11 | tiro repetido aceito | morto (3 falhas) |
| M12 | atira com a frota incompleta | morto (1 falha) |
| M13 | derrota com três navios afundados | morto (5 falhas) |
| M14 | jogador atira no próprio tabuleiro | morto (15 falhas) |
| M15 | a vez não passa | morto (4 falhas) |
| M16 | a visão revela a frota inimiga intacta | morto (9 falhas) |
| M17 | vence quem levou o último tiro | morto (9 falhas) |

**Resultado: 16/17 na primeira rodada, 17/17 depois.**

**O que o M8 ensinou.** Ele troca `navios.size === 4` por `navios.size >= 3` em
`completo()`. A suíte de 61 casos não pegou: havia caso com **0** navios
(incompleto) e caso com **4** (completo), mas nenhum com **exatamente 3** — o
valor de fronteira. Com o mutante vivo, um tabuleiro de três navios liberaria o
primeiro tiro, que é justamente a regra que `completo()` existe para impor. O
caso do ciclo 7 fecha a fronteira, e rodando o M8 de novo ele morre.

Esse é o ponto do teste de mutação: toda linha de `completo()` já era executada
pela suíte, e mesmo assim o defeito passava. **Linha executada não é linha
testada.**

---

## 4. Resultado

| Medida | Valor |
| --- | --- |
| Casos de teste | **62**, em 10 suítes |
| Execução | 62 passam, 0 falham, ~160 ms |
| Linhas | 776 de teste + 32 de apoio, para 285 de modelo |
| Ciclos de TDD | 7, um commit cada |
| Casos vermelhos antes do verde | 56 de 62 |
| Mutantes mortos | **17 de 17** |
| Dependências | **zero** (só `node:test` e `node:assert`) |

### O que ficou de fora, de propósito

- **Interface.** O desafio pede casos de teste, não um jogo jogável. Sem CLI e
  sem tela: o teste de integração já joga a partida inteira pela API.
- **Cobertura por ferramenta.** O `--experimental-test-coverage` diria uma
  porcentagem, e o M8 mostra exatamente por que ela engana. O teste de mutação
  responde a pergunta que importa — *os casos pegam defeito?* — e foi esse que
  eu rodei.
- **Variantes de regra** (tiro extra no acerto, navios que não podem encostar).
  Não estão no enunciado; estão registradas na seção 1.8 como decisão, não
  entregues como regra.
