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
  versões próprias para computador e celular; com movimento reduzido (ou sem JS) o conteúdo aparece em fluxo normal.
- **Ajuda e segurança** (`src/components/HelpMenu.tsx`) substitui a faixa escura: botão no topo de todas as páginas, painel
  com CVV/SAMU/Polícia, SaferNet, Disque 100 e **Sair rápido**.
- **Painel do jovem** com retomar, próximo passo do plano, "por onde começar" e todas as ferramentas.
- **Ferramentas novas** (só do jovem, `src/lib/dal-tools.ts`): linha do tempo, plano de próximos passos (regras fixas em
  `src/lib/plan.ts`) e rascunho de denúncia com "Melhorar com IA" (reescreve sem mudar fatos; nada é enviado sozinho).
- **Pedido com resumo anexado**: o jovem escolhe anexar; o resumo não leva nomes de usuário nem onde guardou os prints.
- **Profissional**: pausar/retomar novos pedidos (sai do diretório) e "Sugerir rascunho" de resposta com IA.
- Transições: View Transitions entre páginas, menus e botões com movimento próprio — tudo desligado com movimento reduzido.

Como testar a abertura: abra http://localhost:3000, role devagar até a moldura com os quatro caminhos e volte. Para a
versão reduzida, ative "Reduzir movimento" no sistema (Windows: Configurações › Acessibilidade › Efeitos visuais ›
Efeitos de animação desligado) e recarregue.

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

Integração pronta em `src/lib/ai/provider.ts` com a API da Anthropic (Claude). **Sem chave, funciona em modo
demonstração**, com respostas fixas e um aviso na tela. Para ativar:

1. Crie uma chave em https://console.anthropic.com/ (Settings → API Keys).
2. Copie `.env.example` para `.env.local` e preencha `ANTHROPIC_API_KEY=...`.
3. Opcional: `AI_MODEL` (padrão `claude-opus-5-5`; `claude-sonnet-5-5` ou `claude-haiku-5-5` custam menos).
4. Reinicie o `npm run dev`.

Cuidados já incluídos: instruções de sistema (identifica-se como IA, não diagnostica, não promete resultados, tom
simples), detecção de palavras de risco no servidor que mostra CVV/SAMU/Polícia na hora (`src/lib/ai/safety.ts`),
limite de 30 mensagens por hora, só as últimas 20 mensagens vão para o modelo, e reserva automática de modelo
caso o principal recuse. As mensagens enviadas à IA saem do servidor para a Anthropic — isso está dito na página
de privacidade.

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
