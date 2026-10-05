# Tarefas — Adaptação do Portfólio para João Vitor Dias Fernandes

Plano relacionado: `spec/04-plano/adaptacao-portfolio-joao-vitor/plano.md`
Spec relacionada: `spec/03-features/adaptacao-portfolio-joao-vitor/spec.md`

## Regra das tarefas
Cada tarefa é atômica, referencia os requisitos da spec que atende e possui critérios claros de verificação.

---

## Fase 1 — Configuração e Recursos Estáticos

- [x] T-001 [FR-007] Copiar os arquivos de currículo em PDF para a aplicação.
  - Arquivos: `public/curriculum-pt.pdf` e `public/curriculum-en.pdf`.
  - Origem: `C:\Users\xjoao\Desktop\curriculos\Currículo.pdf` e `Curriculum.pdf`.
  - Verificação: os arquivos existem no build e respondem para download público.

- [x] T-002 [FR-008] Garantir suporte a carregamento seguro de variáveis `.env` no script de runtime.
  - Arquivo: `scripts/generate-runtime-config.mjs`.
  - Verificação: `node scripts/generate-runtime-config.mjs` gera `public/runtime-config.js` preenchendo a URL e chave do novo projeto Supabase de João Vitor (`efxcpncyzqtfaewdbaar`).

---

## Fase 2 — Domínio de Conteúdo e Fallbacks Locais

- [x] T-003 [FR-001, FR-002, FR-005, FR-006, FR-007] Atualizar o contrato e os fallbacks em Português no domínio de conteúdo.
  - Arquivo: `src/app/features/portfolio/content/portfolio-content.ts`.
  - Verificação: `ORIGINAL_COPY`, `PORTFOLIO_SKILL_CATEGORIES`, `PORTFOLIO_ACADEMIC_ENTRIES` e `PORTFOLIO_CONTACT_LINKS` contêm os dados, links e métricas de João Vitor Fernandes.

- [x] T-004 [FR-001, FR-002, FR-005, FR-006, FR-007] Atualizar as traduções em Inglês no domínio de conteúdo.
  - Arquivo: `src/app/features/portfolio/content/portfolio-translations.ts`.
  - Verificação: `ENGLISH_COPY` possui todas as chaves traduzidas em inglês com precisão técnica.

- [x] T-005 [FR-001, FR-007] Atualizar referências de apresentação no template e testes.
  - Arquivos: `src/index.html`, `src/app/features/portfolio/presentation/portfolio-page/portfolio-page.html`, `src/app/app.spec.ts`, `src/app/features/portfolio/presentation/portfolio-page/portfolio-page.spec.ts`.
  - Verificação: o título da página e o cabeçalho `h1` exibem João Vitor Dias Fernandes; testes validam a renderização com sucesso.

---

## Fase 3 — Banco de Dados Supabase (Novo Projeto Próprio)

- [x] T-006 [FR-008] Gerar script SQL de setup inicial do banco de dados de João Vitor.
  - Arquivo: `supabase/setup_joao_vitor.sql`.
  - Conteúdo: Schemas, tabelas, storage buckets, RLS e dados iniciais com as 4 experiências, 2 projetos, formação no IFMG, contatos e habilidades de João Vitor.
  - Verificação: script idempotente pronto para execução no SQL Editor do painel Supabase.

---

## Fase 4 — Verificação e Testes

- [x] T-007 [FR-001 até FR-008] Executar a suíte de testes unitários.
  - Verificação: `npx ng test --no-watch` executa 153 testes em 29 arquivos com 100% de aprovação.

- [x] T-008 [FR-001 até FR-008] Executar o build de produção do Angular.
  - Verificação: `npm run build` conclui com sucesso gerando os bundles na pasta `dist/portfolio`.
