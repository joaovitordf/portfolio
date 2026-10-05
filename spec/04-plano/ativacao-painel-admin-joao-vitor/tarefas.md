# Tarefas — Ativação do Painel Administrativo (João Vitor)

Plano relacionado: `spec/04-plano/ativacao-painel-admin-joao-vitor/plano.md`
Spec relacionada: `spec/03-features/ativacao-painel-admin-joao-vitor/spec.md`

## Regras
- Cada tarefa deve ser executada atomicamente.
- Testes automatizados cobrem o caminho feliz e erros previstos.
- Nada de dados do amigo em novas tabelas ou snapshots.

---

## Fase 1 — Banco de Dados Editorial (Supabase)

- [x] **T-001 [FR-001, FR-002]** Criar o gerador de snapshot inicial editorial com os dados de João Vitor Fernandes.
  - Arquivo: `scripts/generate-joao-editorial-snapshot.mjs`.
  - Critério de aceite: O snapshot gerado contém as 4 experiências, 2 projetos, formação IFMG, contatos e habilidades de João Vitor em PT-BR e EN, sem nenhuma menção a dados de Marcos Santos. (Concluído: 164 entidades, 32 tecnologias, validado por teste).

- [x] **T-002 [FR-001, FR-006, FR-007, FR-008]** Montar o script consolidado idempotente do CMS Editorial.
  - Arquivo: `supabase/setup_editorial_joao_vitor.sql`.
  - Critério de aceite: Cria roles, schema `portfolio_editorial`, tabelas, storage buckets editoriais, policies, funções RPC (`get_editor_draft`, `get_editorial_technology_catalog`, `create_editorial_technology`, `update_editorial_technology`, etc.) e importa o snapshot inicial de João. Revoga leitura pública de `portfolio_admins`. (Concluído: script idempotente gerado).

---

## Fase 2 — Frontend, Correção do Fluxo de Login e Conexão do Site Público

- [x] **T-003 [FR-004, FR-005]** Corrigir a navegação pós-login e restore de sessão em `AdminAuthentication`.
  - Arquivo: `src/app/features/admin/authentication/admin-authentication.ts`.
  - Critério de aceite: Após o login bem-sucedido com credenciais válidas, a transição para `AdminWorkspace` ocorre imediatamente na mesma tela sem necessidade de pressionar F5. A chamada `restoreSession` redireciona para a rota correta. (Concluído).

- [x] **T-004 [FR-004, FR-005]** Conectar site público à publicação do editor e atualizar os testes unitários.
  - Arquivos:
    - `src/app/features/portfolio/content/editorial-snapshot-adapter.ts`
    - `src/app/features/portfolio/content/editorial-snapshot-adapter.spec.ts`
    - `src/app/features/portfolio/content/portfolio-content.service.ts`
    - `src/app/features/admin/authentication/admin-authentication.spec.ts`
    - `src/app/features/portfolio/content/portfolio-content.service.spec.ts`
  - Critério de aceite: Quando há publicação ativa no CMS editorial, o site público renderiza o snapshot publicado instantaneamente; se não houver, mantém fallback gracioso nas tabelas legadas. Testes cobrem o fluxo de login reativo e projeção do snapshot. (Concluído: 164/164 testes passando).

---

## Fase 3 — Revisão de Estilização e Relatório de Melhorias

- [x] **T-005** Consolidar o relatório de análise de estilização e plano de melhorias futuras.
  - Arquivo: `spec/05-verificacao/ativacao-painel-admin-joao-vitor/revisao-estilo.md`.
  - Critério de aceite: Documentar problemas pontuais de CSS/UX encontrados no portfólio público e no admin, inventariar ícones ausentes e elencar melhorias priorizadas (Alta / Média / Baixa). (Concluído).

---

## Fase 4 — Verificação e Homologação

- [ ] **T-006 [FR-006, FR-007]** Executar script no Supabase de João e validar o funcionamento das RPCs e da adição de habilidades no Gerenciador de Mídias.
  - Arquivo a ser executado: `supabase/setup_editorial_joao_vitor.sql`.
  - Critério de aceite: `/admin/media` carrega com status 200 (sem erro 404 em `get_editor_draft`). Adicionar uma habilidade com ícone grava no banco com sucesso. Após execução e confirmação, remover scripts SQL temporários para manter o repositório limpo.

- [x] **T-007 [AC-009]** Executar testes automatizados completos e build de produção.
  - Critério de aceite: 100% dos testes passam (`npx ng test --no-watch`: 164/164) e `npm run build` conclui sem erros. (Concluído).
