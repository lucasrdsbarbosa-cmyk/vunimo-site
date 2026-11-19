# Vunimo — site

Apoio para adolescentes (13–17 anos) que passam por ciberbullying em redes sociais e jogos, com a metodologia dos
materiais do projeto: **Regular (Pausa) · Desabafar (diário + IA) · Orientar · Conectar (Apoio)**, em ordem livre.
Inclui área do jovem, cadastro e área de profissionais de saúde, e uma administração para aprovar profissionais.

## Como rodar

Requisitos: Node.js 24 ou mais novo (o projeto foi feito com o Node 26). Na pasta `site`:

```powershell
npm install
npm run seed      # cria o banco em data/vunimo.db com as contas fictícias
npm run dev       # abre em http://localhost:3000
```

Testes de ponta a ponta (computador 1280×800 e celular 390×844) — com o `npm run dev` rodando ou não:

```powershell
npm run test:e2e
```

Outras verificações: `npm run typecheck`, `npm run lint`, `npm run build`.

## Publicar (grátis)

**Link temporário pelo seu computador** (funciona enquanto o computador e os dois comandos estiverem rodando):

```powershell
npm run publicar:local
```

```powershell
cloudflared tunnel --url http://localhost:3100
```

O segundo comando mostra um endereço `https://….trycloudflare.com` que abre em qualquer aparelho; ele muda a cada vez.
A senha da conta `admin@vunimo.test` nesse modo é a de `ADMIN_PASSWORD` no arquivo `.env.local` (fora do Git).
Rodar os testes (`npm run test:e2e`) volta a senha do admin para a de teste.

**Link fixo no Render** (o site roda nos servidores do Render, mesmo com seu computador desligado):

1. Crie uma conta em https://render.com (dá para entrar com o GitHub).
2. **New › Blueprint**, escolha o repositório `vunimo-site` e confirme. O Render lê `render.yaml`.
3. Espere o primeiro build (alguns minutos). O link fica como `https://vunimo-xxxx.onrender.com`.
4. A senha do admin está em **Environment › ADMIN_PASSWORD** no painel do serviço.

Limites do plano gratuito: o serviço dorme após ~15 min sem visitas (o primeiro acesso depois leva até 1 min) e o
banco é recriado a cada início — contas criadas no site somem. Para guardar dados de verdade, o próximo passo é
trocar o SQLite por um banco hospedado (Turso ou Supabase).

## Contas fictícias (criadas por `npm run seed`)

Todas usam a senha **`Vunimo@teste1`** (definida em `scripts/seed.mts`). Rodar o seed de novo recria essas contas.

| E-mail | Papel | Para testar |
|---|---|---|
| `jovem@vunimo.test` | jovem (Lu) | "continuar de onde parou", diário, linha do tempo com 2 registros |
| `jovem2@vunimo.test` | jovem (Teo) | tem um pedido aberto para a Ana; diário privado |
| `psicologa@vunimo.test` | profissional aprovada (Ana) | responder pedidos |
| `medico@vunimo.test` | profissional em análise (Carlos) | não aparece no diretório nem recebe pedidos |
| `admin@vunimo.test` | administração | aprovar/recusar profissionais |

## Versão 2 — o que há de novo

Plano e roteiro da abertura: [docs/plano-v2.md](docs/plano-v2.md).

- **Abertura "Duas formas abrem espaço"** (`src/components/home/HeroScene.tsx`): GSAP ScrollTrigger + Timeline com o
  símbolo original extraído do PDF da identidade. As formas se afastam, atravessam o pôster Íris, a palavra "vunimo"
  vira o logo do topo e as formas se encaixam como cantos da moldura dos quatro caminhos. Rolagem nativa e reversível;
  versões próprias para computador e celular. A abertura roda sempre, mesmo com "reduzir movimento" no sistema
  (decisão do projeto); só sem JS o conteúdo aparece em fluxo normal.
- **Ajuda e segurança** (`src/components/HelpMenu.tsx`) substitui a faixa escura: botão no topo de todas as páginas, painel
  com CVV/SAMU/Polícia, SaferNet, Disque 100 e **Sair rápido**.
- **Painel do jovem** com retomar, próximo passo do plano, "por onde começar" e todas as ferramentas.
- **Ferramentas novas** (só do jovem, `src/lib/dal-tools.ts`): linha do tempo, plano de próximos passos (regras fixas em
  `src/lib/plan.ts`) e rascunho de denúncia com "Melhorar com IA" (reescreve sem mudar fatos; nada é enviado sozinho).
- **Pedido com resumo anexado**: o jovem escolhe anexar; o resumo não leva nomes de usuário nem onde guardou os prints.
- **Profissional**: pausar/retomar novos pedidos (sai do diretório) e "Sugerir rascunho" de resposta com IA.
- Transições: View Transitions entre páginas, menus e botões com movimento próprio — tudo desligado com movimento reduzido.

### Interações (v3)

- **Clique:** onda curta a partir do ponto tocado em botões (`src/components/PressFeedback.tsx`), botão afunda ao
  pressionar, pontinhos enquanto envia, mensagem de sucesso com ✓ e erro com um leve balanço.
- **Abas:** indicador que desliza até a aba ativa na barra inferior, na lateral e no topo
  (`useSlidingIndicator.ts`); o conteúdo entra deslizando para o lado da aba escolhida (View Transitions com
  `transitionTypes`).
- **Rolagem:** a barra de navegação recolhe ao descer e volta ao subir, só com `transform` (`AutoHideHeader.tsx`);
  na página inicial ela fica durante a abertura.
- **Caixinhas:** painel de ajuda com itens em cascata, confirmação de apagar com diálogo próprio (no lugar do
  `confirm` do navegador), "Resumo anexado" abre com altura animada, selects com seta Íris.
- **Calendário** (`src/components/DatePicker.tsx`): hoje com anel Lima, escolhido em Íris com os cantos do símbolo,
  datas futuras riscadas; atalhos Hoje/Ontem; vira folha de baixo no celular. Teclado: setas, Home/End,
  PageUp/PageDown (Shift = ano), Enter escolhe, Esc fecha.
- Tudo isso respeita "reduzir movimento" do sistema (a abertura da página inicial é a exceção, por decisão do projeto).

Como testar a abertura: abra http://localhost:3000, role devagar até a moldura com os quatro caminhos e volte.

## O que é público e o que é privado

| Dado | Visitante | Jovem | Profissional | Admin |
|---|---|---|---|---|
| Pausa, Orientação, canais de apoio | lê | lê | lê | lê |
| Diretório (só aprovados, sem e-mail) | lê | lê | lê | lê |
| Diário, conversa com IA, progresso | — | só os seus | nunca | nunca |
| Linha do tempo, plano, rascunhos de denúncia | — | só os seus | só o resumo que o jovem anexar a um pedido | nunca |
| Pedido de apoio | — | cria, lê e cancela os seus | lê e responde os endereçados a ele, se aprovado | — |
| Perfil profissional | — | — | edita o seu (mudar registro volta para análise) | lê todos, aprova/recusa |

Onde isso é aplicado:

- **Servidor:** `src/lib/dal.ts` é a única porta para o banco. Cada função pega o usuário pela sessão (cookie
  httpOnly; só o hash do token fica no banco) e filtra pelo dono — ids enviados pelo navegador nunca bastam. Toda
  Server Action passa por ela. `src/proxy.ts` só redireciona quem nem tem cookie.
- **Banco:** `src/lib/schema.ts` tem chaves estrangeiras com exclusão em cascata (apagar a conta apaga tudo),
  papéis válidos e gatilhos que recusam diário/IA de quem não é jovem, pedidos para profissional não aprovado e
  troca de dono de registros. SQLite não tem RLS; `docs/supabase-rls.sql` traz as políticas equivalentes para uma
  migração a Postgres/Supabase.
- Limites de tentativas em login, cadastro, conversa com IA e pedidos (`src/lib/rate-limit.ts`, em memória).

## IA (conversa no Desabafar)

Fluxo: chat do site → `POST /api/conversa` (`src/app/api/conversa/route.ts`) → API oficial da Anthropic
(`src/lib/ai/provider.ts`, SDK `@anthropic-ai/sdk`, endereço fixo `https://api.anthropic.com`) → resposta em
streaming de volta ao chat. **Não há respostas prontas:** sem chave, o chat mostra que a IA está desligada e não
gera nada.

Para ligar:

1. Crie uma chave em https://console.anthropic.com/ (Settings → API Keys) e adicione créditos em Billing.
2. No computador: em `.env.local`, `ANTHROPIC_API_KEY=...`. No Render: Environment → `ANTHROPIC_API_KEY`.
3. Opcional: `AI_MODEL` (padrão `claude-opus-5-5`; `claude-sonnet-5-5` ou `claude-haiku-5-5` custam menos).
4. Reinicie o `npm run dev` e confira com `npm run ia:verificar` (mostra modelo, id da mensagem e tokens; nunca a chave).
5. Teste real no site: `$env:IA_REAL="1"; $env:BASE_URL="http://localhost:3000"; npx playwright test ia-real --project=computador`.

Como funciona:

- **Conversas separadas:** "Nova conversa" começa outra, com histórico próprio; as anteriores ficam na lista. Só o
  histórico da conversa aberta (até 30 mensagens) vai para o modelo.
- **Erros de verdade:** chave inválida, sem créditos, modelo indisponível, limite de uso, instabilidade ou falta de
  conexão aparecem como erro (não como resposta da IA). A mensagem não fica gravada e "Tentar de novo" a reenvia uma
  vez só.
- **Voz** (`src/components/voice.ts`): ditado do navegador em pt-BR (Chrome, Edge, Safari; o Brave não oferece, e a
  tela explica). "Ouvir" em cada resposta e **Modo voz** (envia ao terminar de falar e lê a resposta).
- **Diário + IA:** "Conversar com a IA sobre isto" leva o texto do registro para a caixa, para revisar antes de enviar.
- **Testes:** `npm run test:e2e` sobe um servidor próprio (porta 3300) ligado a uma **simulação** da API
  (`tests/e2e/mock-anthropic.mjs`), que confere o que o site envia; as respostas simuladas começam com "[simulação]".

Cuidados: instruções do assistente (identifica-se como IA, responde de forma proporcional e específica, diz seus
limites, não diagnostica), detecção de palavras de risco no servidor que mostra CVV/SAMU/Polícia na hora
(`src/lib/ai/safety.ts`) e limite de 30 mensagens por hora. As mensagens enviadas à IA saem do servidor para a
Anthropic — isso está dito na página de privacidade.
## Suposições (fáceis de ajustar)

- Pausa, Orientação e Apoio não exigem conta; diário, IA e pedidos exigem, porque guardam dados.
- Cadastro do jovem: apelido, e-mail, senha e ano de nascimento (mínimo 13 anos — `MIN_AGE` em `src/lib/validation.ts`).
- Papel do profissional: aparece no diretório depois de aprovado e responde pedidos pela própria Vunimo, sem
  contato externo. Nunca vê diário nem conversas.
- Mural de apoio: só como conceito, como nos materiais.
- Textos da metodologia e canais de ajuda ficam em `src/lib/content.ts`.

## Estrutura

```
src/app/(site)/      páginas institucionais: início, entrar, cadastro, profissionais, sobre, privacidade
src/app/(jornada)/   metodologia (comecar, pausa, desabafar, orientar, conectar) e área do jovem (app/*)
src/app/pro/         área do profissional       src/app/admin/   aprovação de profissionais
src/app/actions/     Server Actions             src/lib/         banco, sessão, permissões, validação, IA
tests/e2e/           testes Playwright          scripts/seed.mts contas fictícias
```
