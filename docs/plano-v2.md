# Vunimo v2 — plano curto e roteiro da abertura

## O que muda

1. **Ajuda e segurança no lugar da faixa escura.** Um botão fixo no topo (site, jornada e áreas logadas) abre um painel com
   CVV 188, SAMU 192, Polícia 190, SaferNet, Disque 100 e um botão **Sair rápido** (troca a página por um site neutro
   sem deixar a Vunimo no botão Voltar). Funciona sem conta, no teclado (Esc fecha) e no toque.
2. **Abertura cinematográfica** na página inicial, guiada pela rolagem e com o símbolo original extraído do PDF da
   identidade (dois traços de 97,2 px, pontas arredondadas).
3. **Painel do jovem** reorganizado: por onde começar, ferramentas disponíveis, retomar.
4. **Ferramentas novas** para quem acabou de sofrer ciberbullying:
   - *Linha do tempo do ocorrido* — registra quando, onde, o que, quem e se há print.
   - *Plano de próximos passos* — checklist montado a partir de 4 perguntas (regras fixas, sem IA), com links para a Orientação.
   - *Rascunho de denúncia* — texto editável para plataforma, escola, responsável ou SaferNet, montado a partir da linha
     do tempo; a IA pode reescrever de forma clara e objetiva (tarefa concreta, sempre revisada pela pessoa, nunca enviada sozinha).
   - *Anexar resumo ao pedido de apoio* — o jovem escolhe incluir um resumo da linha do tempo; o profissional vê só esse resumo.
5. **Área do profissional**: disponibilidade (aceitando ou não novos pedidos), pedidos com resumo anexado, e a IA sugere um
   rascunho de resposta que o profissional revisa.
6. **Movimento com personalidade** em menus, botões e na troca de páginas (View Transitions), com versão reduzida.

Privacidade: linha do tempo, plano e rascunhos são só do jovem (servidor + gatilhos no banco). Nada vai a profissionais
sem a escolha explícita de anexar. A IA recebe apenas o texto da tarefa pedida.

## Roteiro da abertura — "Duas formas abrem espaço"

Metáfora da marca: *duas formas autônomas, um espaço em comum*. Inspirado no Dondre Green (o título vira o logo; o
elemento muda de função), aqui **o símbolo deixa de ser protagonista e vira a moldura** da metodologia.

| Beat | Rolagem | O que se vê | Movimento |
|---|---|---|---|
| Entrada | 0% | Pôster Íris em tela cheia (com margem e cantos arredondados). Símbolo grande em branco + lima, palavra "vunimo", frase "Presença que abre caminhos." Botões **Começar agora**, **Criar conta**, **Entrar** já disponíveis. | Formas respiram de leve (só no carregamento). |
| Abrir espaço | 0–35% | As duas formas se afastam na diagonal; entre elas surge "Aconteceu algo ruim nas redes ou num jogo?". | Formas separam, título do pôster sobe e some, camadas lima de fundo andam em velocidades diferentes. |
| Atravessar | 35–65% | O pôster Íris se recolhe por trás das formas (clip-path), revelando o papel. A palavra "vunimo" sobe e encolhe até o logo do topo — e o logo do topo acende. | Formas atravessam a borda do pôster; mudam de cor (branco → íris, lima continua). |
| Encaixe (momento marcante) | 65–100% | As formas encolhem e se encaixam como cantos de uma moldura em volta dos **quatro caminhos** (Pausa, Desabafar, Orientação, Apoio), que aparecem um a um. | Formas viram colchetes da moldura; cartões entram em sequência. |
| Saída | depois | A cena solta e a página rola normalmente: IA, profissionais e chamada final. | Rolagem nativa. |

- **Computador:** profundidade com 3 camadas (fundo lima lento, pôster, formas na frente), cena de ~220% da altura da tela.
- **Celular:** formas menores e centralizadas, percurso vertical, moldura em grade 2×2 compacta, cena de ~150%.
- **Movimento reduzido / sem JS:** sem fixar a tela; pôster estático e, logo abaixo, a moldura com os cantos já no lugar.
  Mesmos textos e botões.

## Tecnologia

GSAP + ScrollTrigger + Timeline (`@gsap/react` para limpeza), porque a cena sincroniza 8+ elementos em etapas com
`scrub`, `pin` e posições calculadas a partir do layout (`invalidateOnRefresh`). `gsap.matchMedia()` separa computador,
celular e movimento reduzido. O símbolo é SVG inline (traços reais do PDF), então muda de cor, escala e posição sem perder nitidez.
