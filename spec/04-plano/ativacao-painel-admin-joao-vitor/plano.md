# Plano de Implementação — Ativação do Painel Administrativo (João Vitor)

Spec relacionada: `spec/03-features/ativacao-painel-admin-joao-vitor/spec.md`
Tarefas: `spec/04-plano/ativacao-painel-admin-joao-vitor/tarefas.md`

## 1. Visão Geral e Arquitetura

O objetivo é deixar o fluxo completo da área administrativa funcionando para João Vitor Fernandes,
cobrindo a correção da navegação pós-login, a criação das funções e schema editorial no Supabase
de João (resolvendo o 404 de `get_editor_draft` e o erro ao adicionar habilidades), e a revisão
completa de estilização com lista de melhorias futuras.

---

## 2. Diagnóstico Técnico Detalhado

### 2.1. Problema de Navegação Pós-Login (exige F5)
- **Arquivo**: `src/app/features/admin/authentication/admin-authentication.ts` e `src/app/app.routes.ts`.
- **Causa**:
  No `app.routes.ts`:
  ```typescript
  { path: 'admin', component: AdminWorkspace, canMatch: [adminAuthGuard] },
  { path: 'admin', component: AdminAuthentication },
  ```
  Ambos compartilham o caminho `'admin'`. Quando o usuário acessa deslogado, `adminAuthGuard` retorna `false`, e o Angular escolhe `AdminAuthentication`.
  Ao fazer login com sucesso, `admin-authentication.ts` executa:
  ```typescript
  await this.router.navigate(['/admin']);
  ```
  Como o navegador já está na URL `/admin`, o Angular Router ignora a navegação (`onSameUrlNavigation: 'ignore'`) e **não reavalia** os guards `canMatch`. O componente `AdminWorkspace` não é ativado até que a página seja recarregada (F5).
  Além disso, a linha 49 tenta navegar para `['/admin', 'area']`, rota que não existe e cai no wildcard `**` (home).
- **Solução Arquitetural**:
  Forçar a reavaliação do router ou navegar com reset de rota para que o `canMatch` seja reexecutado imediatamente após o sucesso do `signIn`, transicionando instantaneamente para `AdminWorkspace`.

### 2.2. Erro ao Carregar e Criar Habilidade (`get_editor_draft 404`)
- **Arquivo**: `src/app/features/admin/media-management/media-management.service.ts` e banco Supabase.
- **Causa**:
  O `MediaManagementService` chama via RPC:
  - `get_editor_draft`
  - `get_editorial_technology_catalog`
  - `create_editorial_technology` / `update_editorial_technology`
  Essas funções pertencem ao schema `portfolio_editorial` e às migrations `20260926093000` a `20260927141000`.
  No banco do João, apenas as tabelas legadas do `setup_joao_vitor.sql` foram criadas.
- **Solução Arquitetural**:
  Criar o script de migração/ativação do CMS editorial para o Supabase de João (`supabase/setup_editorial_joao_vitor.sql`), contendo:
  1. Criação dos roles `portfolio_editorial_owner` e `portfolio_editorial_executor`.
  2. Criação do schema `portfolio_editorial` e suas tabelas (`draft`, `draft_locales`, `technologies`, `draft_entities`, `draft_translations`, `publications`, `site_state`, `media`, `draft_media_refs`, `operations`).
  3. Buckets de storage editorial (`editorial-project-images`, `editorial-skill-icons`, `editorial-curricula`) com RLS.
  4. Carga do snapshot inicial com **os dados de João Vitor** (gerado a partir dos dados atuais).
  5. Todas as funções RPC necessárias (`get_editor_draft`, `get_editorial_technology_catalog`, `create_editorial_technology`, `update_editorial_technology`, `save_editor_command`, `publish_editor_draft`, etc.).
  6. Restrição de segurança: `portfolio_admins` não legível por `anon`.

---

## 3. Fases de Execução

1. **Fase 1 — Preparação do Snapshot e Script SQL do CMS**
   - Gerar os dados do snapshot inicial com as informações de João Vitor (IFMG, SensorEng, Avante, Russian Mastery, Boxe, etc.).
   - Criar `supabase/setup_editorial_joao_vitor.sql` idempotente e testável.
2. **Fase 2 — Correção do Frontend (Login e Navegação)**
   - Corrigir a navegação imediata pós-login em `admin-authentication.ts`.
   - Corrigir a rota de restore de sessão.
   - Atualizar testes de autenticação (`admin-authentication.spec.ts`).
3. **Fase 3 — Execução e Validação no Banco Supabase**
   - Fornecer instruções e executar o script no banco de João.
   - Validar que `get_editor_draft` e criação de habilidade respondem com sucesso.
4. **Fase 4 — Revisão de Estilo e Documentação**
   - Consolidar o relatório de estilo e lista priorizada de melhorias em `revisao-estilo.md`.
5. **Fase 5 — Verificação de Regressão e Portão de Aprovação**
   - Rodar toda a suíte de testes (153+ testes).
   - Validar build limpo.

---

## 4. Estratégia de Rollback
- O frontend mantém o fallback local intacto. Se o banco falhar, o site público continua 100% no ar.
- O script do banco é idempotente com `IF NOT EXISTS` e policies condicionadas, sem alterar tabelas de dados já populadas (`portfolio_experiences`, etc.).
