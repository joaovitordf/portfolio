# Spec da Feature - Ativação do painel administrativo (João Vitor)

Status: Rascunho - aguardando revisão de João Vitor
Data: 2026-10-05
Plano: `spec/04-plano/ativacao-painel-admin-joao-vitor/plano.md`
Tarefas: `spec/04-plano/ativacao-painel-admin-joao-vitor/tarefas.md`
Revisão de estilo: `spec/05-verificacao/ativacao-painel-admin-joao-vitor/revisao-estilo.md`

## 1. Objetivo

Deixar o painel administrativo (`/admin`, `/admin/editor`, `/admin/media`) funcionando no
Supabase próprio de João Vitor (`efxcpncyzqtfaewdbaar`), com o conteúdo de João, sem
qualquer acesso ao Supabase ou ao deploy do amigo (`jjndvtjhxutuerwvjocy`).

## 2. Contexto - o que foi investigado (fatos, não suposições)

| # | Sintoma relatado | Causa encontrada |
|---|------------------|------------------|
| P1 | `POST /rest/v1/rpc/get_editor_draft 404` e "Não foi possível salvar a mídia" ao criar habilidade | O banco de João foi criado pelo script avulso `supabase/setup_joao_vitor.sql`, que cria **só as tabelas públicas legadas**. O painel depende do schema privado `portfolio_editorial` e de ~20 funções RPC criadas pelas migrations `20260926093000` a `20260927141000`, que nunca foram aplicadas. O Gerenciador de Mídias chama `get_editor_draft` e `get_editorial_technology_catalog` ao carregar e ao criar habilidade — ambas inexistentes → 404. |
| P2 | Após login correto em `/admin`, a tela não muda; só entra após F5 | Em `admin-authentication.ts`, após o login o código faz `router.navigate(['/admin'])`. A URL atual **já é** `/admin` e o Router do Angular ignora navegação para a mesma URL (`onSameUrlNavigation: 'ignore'` por padrão). O guard `canMatch` não é reavaliado, então a rota do `AdminWorkspace` não é escolhida. O F5 força nova avaliação. Além disso, `restoreSession()` navega para `/admin/area`, rota inexistente (cai no `**` → home). |
| P3 | (descoberta) Mesmo com o painel funcionando, o que for publicado no editor **não aparece no site público** | O site público (`PortfolioPage` → `PortfolioContentService`) lê as tabelas legadas `public.portfolio_*`. A publicação do editor grava apenas em `portfolio_editorial.publications`. O leitor `PublishedSnapshotService` existe, mas **não está ligado a nenhuma página**. A spec do amigo marca isso como concluído (T-012/T-032), mas o código não reflete — divergência herdada. |
| P4 | (descoberta, segurança) Leitura pública da tabela de admins | O script avulso criou a policy `public_read` em **todas** as tabelas `portfolio_%`, inclusive `portfolio_admins`, e deu `grant select on all tables` para `anon`. Verificado: a chave pública consegue ler o UUID do admin. As migrations oficiais restringem isso. |
| P5 | (descoberta, documentação) | `spec/03-features/adaptacao-portfolio-joao-vitor/spec.md` está vazio (0 bytes), embora plano e tarefas o referenciem. |

## 3. Requisitos funcionais (EARS)

- **FR-001** - O SISTEMA DEVE ter no Supabase de João o mesmo schema do repositório
  (tabelas públicas + schema editorial + funções RPC + buckets + policies), aplicado pelas
  migrations versionadas em `supabase/migrations/`, e não por script avulso.
- **FR-002** - QUANDO o schema editorial for criado, O SISTEMA DEVE importar como rascunho e
  publicação inicial **o conteúdo de João Vitor** (textos, 4 experiências, 2 projetos,
  habilidades, formação IFMG, contatos), e NÃO DEVE gravar nenhum dado pessoal do amigo
  (nome, e-mail, telefone, links, experiências, projetos) no banco de João.
- **FR-003** - O SISTEMA DEVE manter as tabelas públicas legadas populadas com o conteúdo de
  João, para que o site público continue idêntico ao atual durante e após a mudança.
- **FR-004** - QUANDO o administrador autorizado enviar credenciais válidas em `/admin`,
  O SISTEMA DEVE exibir a área administrativa imediatamente, sem recarregar a página.
- **FR-005** - QUANDO uma sessão autorizada já existir ao abrir a tela de login,
  O SISTEMA DEVE levar o administrador para `/admin` (área administrativa), e não para uma
  rota inexistente.
- **FR-006** - QUANDO o administrador criar uma habilidade com nome e ícone válidos
  (PNG/JPG/JPEG/SVG até 1 MB) no Gerenciador de Mídias, O SISTEMA DEVE salvá-la no catálogo
  editorial e exibi-la na lista sem erro.
- **FR-007** - O Gerenciador de Mídias DEVE carregar projetos, catálogo de habilidades e
  currículos sem erro 404.
- **FR-008** - O SISTEMA NÃO DEVE permitir leitura de `portfolio_admins` por `anon`.
- **FR-009** *(depende da Pergunta Q1)* - QUANDO o administrador publicar o rascunho no
  editor, O SISTEMA DEVE exibir o conteúdo publicado no site público.
- **FR-010** - O SISTEMA DEVE preservar o projeto Supabase e o deploy do amigo: nenhum
  comando, script ou configuração pode apontar para `jjndvtjhxutuerwvjocy`.

## 4. Critérios de aceite (Given/When/Then)

- **AC-001 (FR-004)** - Dado que estou deslogado em `/admin`, quando envio e-mail e senha
  corretos, então vejo a área administrativa sem apertar F5.
- **AC-002 (FR-004)** - Dado credenciais erradas, quando envio, então continuo na tela de
  login com a mensagem de erro e sem acesso.
- **AC-003 (FR-005)** - Dado que já estou logado, quando abro `/admin`, então vejo a área
  administrativa (nunca a home).
- **AC-004 (FR-006, FR-007)** - Dado que estou em `/admin/media`, quando a tela carrega,
  então não há erro 404 no console e as seções mostram projetos (2), habilidades do catálogo
  e currículos; quando crio a habilidade "Angular" com um PNG de até 1 MB, então ela aparece
  no catálogo e nenhuma mensagem de erro é exibida.
- **AC-005 (FR-002)** - Dado o banco migrado, quando consulto o rascunho no editor
  (`/admin/editor`), então todos os textos, experiências, projetos, formação e contatos são
  de João; uma busca por "Marcos", "Alvoar", "DocFlow", "Unopar" e pelo telefone/e-mail do
  amigo no banco não retorna nada.
- **AC-006 (FR-003)** - Dado o banco migrado, quando abro `http://localhost:4200`, então o
  site exibe as mesmas seções e conteúdos de antes da mudança (4 experiências, 2 projetos).
- **AC-007 (FR-008)** - Dado a chave pública (anon), quando consulto `portfolio_admins`,
  então nenhuma linha é retornada.
- **AC-008 (FR-009)** *(se Q1 = incluir)* - Dado que altero um texto no editor e publico,
  quando recarrego o site público, então vejo o texto alterado.
- **AC-009 (regressão)** - `npx ng test --no-watch` passa integralmente e `npm run build`
  conclui com sucesso.

## 5. Fora de escopo

- Qualquer alteração no Supabase ou na Vercel do amigo.
- Redesenho visual. Problemas de estilo encontrados ficam listados em
  `revisao-estilo.md` como melhorias futuras, para aprovação separada.
- Deploy em produção (Vercel do João) — será uma etapa própria após esta feature.

## 6. Suposições

- S1 - Os dados atuais do banco de João são 100% reproduzíveis a partir do repositório
  (conteúdo veio do `setup_joao_vitor.sql`); o único dado criado manualmente é a linha de
  `portfolio_admins` com o UUID `c50fb5e1-4978-4d35-a08d-08d93abfe38a`, que será recriada.
- S2 - Os buckets de Storage do João estão vazios (nenhum upload feito ainda além da
  tentativa que falhou).
- S3 - João consegue usar o Supabase CLI via `npx supabase` com login próprio
  (access token) e a senha do banco do projeto dele.
- S4 - O `AUTHORIZED_ADMIN_USER_ID` em `admin-auth.models.ts` permanece hardcoded com o UUID
  de João (já alterado por ele). Não é segredo; o banco também valida via `portfolio_admins`.

## 7. Perguntas abertas (preciso da sua decisão)

- **Q1 - Publicação aparecer no site público (P3/FR-009).** Opções:
  - (A, recomendada) Incluir nesta feature: ligar o site público ao snapshot publicado,
    com fallback para as tabelas legadas se não houver publicação. Sem isso, o editor visual
    salva e publica, mas o site não muda.
  - (B) Deixar para uma feature separada. O painel funciona, mas só currículos e imagens de
    projeto (que gravam nas tabelas legadas) aparecem no site.
- **Q2 - Como tratar a migration que importa o conteúdo do amigo**
  (`20260926103000_import_initial_editorial_snapshot.sql`, 67 KB com dados do Marcos):
  - (A, recomendada) Regenerar esse arquivo com o conteúdo de João (o banco de João nunca a
    executou). O dado do amigo nunca entra no seu banco.
  - (B) Manter o arquivo e criar uma migration posterior que sobrescreve. Os dados do amigo
    ficariam gravados no histórico de publicações do seu banco. Não recomendado.
- **Q3 - Forma de aplicar no Supabase:**
  - (A, recomendada) Supabase CLI (`npx supabase link` + `npx supabase db push`): registra
    o histórico de migrations, permite aplicar futuras migrations com um comando.
  - (B) Um arquivo SQL único concatenado para colar no SQL Editor (~150 KB).
- **Q4 - Script avulso `supabase/setup_joao_vitor.sql`:** após a migração ele fica obsoleto
  e conflita com as migrations. Proposta: remover do repositório (o conteúdo de dados passa
  para uma migration de seed). Ok?

