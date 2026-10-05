# Relatório de Alterações do Portfólio

Este documento detalha todas as alterações implementadas no repositório, divididas entre **Alterações Pessoais** (conteúdo e identidade de João Vitor) e **Melhorias Técnicas & Correções de Bugs** (arquitetura, testes e correções de sistema que podem ser aproveitadas em qualquer fork).

---

## 1. Alterações Pessoais (Dados, Currículo e Perfil)

Estas alterações dizem respeito exclusivamente à personalização do portfólio para **João Vitor Dias Fernandes**:

### A. Currículos (PDF)
- **`public/curriculum-pt.pdf`**: Currículo atualizado em português (formato PDF).
- **`public/curriculum-en.pdf`**: Currículo atualizado em inglês (formato PDF).

### B. Conteúdo Estático de Apresentação e Contato
- **`src/index.html`**:
  - Título da página atualizado para "João Vitor Dias Fernandes | Portfólio".
  - Meta tags de descrição e autor ajustadas para João Vitor.
- **`src/app/features/portfolio/presentation/portfolio-page/portfolio-page.html`**:
  - Heading principal e introdução exibindo o perfil de João Vitor Dias Fernandes.
- **`src/app/features/portfolio/content/portfolio-content.ts`**:
  - Dados estáticos de fallback atualizados:
    - **Apresentação & Sobre**: Formação em Ciência da Computação (IFMG), atuação em engenharia de software, front-end, visão computacional e IoT.
    - **Experiências**: SensorEng (Desenvolvedor Front-end), Avante Sistemas (Desenvolvedor Júnior Fullstack), Polo de Inovação IFMG (Estagiário de Engenharia de Software).
    - **Projetos**: Russian Mastery (plataforma full-stack de aprendizado de russo com repetição espaçada) e Pipeline de Visão Computacional para Boxe (TCC com YOLOv8).
    - **Habilidades & Tecnologias**: Categorias de linguagens (TypeScript, Python, Java, PHP, Dart), backend (FastAPI, Spring Boot, Laravel), frontend (Angular, Flutter), bancos de dados (PostgreSQL, MySQL, Supabase, Oracle) e versionamento/visão (Git, OpenCV, YOLOv8).
    - **Formação**: Bacharelado em Ciência da Computação (IFMG).
    - **Contatos**: Links diretos para LinkedIn (`/in/xjoao/`), GitHub (`joaovitordf`), e-mail profissional e telefone.
- **`src/app/features/portfolio/content/portfolio-translations.ts`**:
  - Textos traduzidos para inglês (`en`) e português (`pt-BR`) alinhados a todas as experiências e projetos de João Vitor.

### C. Especificações de Projeto (SDD - Spec-Driven Development)
- **`spec/03-features/adaptacao-portfolio-joao-vitor/`**: Especificação formal da adaptação de perfil.
- **`spec/03-features/ativacao-painel-admin-joao-vitor/`**: Especificação técnica para ativação do painel administrativo.
- **`spec/04-plano/adaptacao-portfolio-joao-vitor/` & `spec/04-plano/ativacao-painel-admin-joao-vitor/`**: Planos e tarefas de execução.
- **`spec/05-verificacao/ativacao-painel-admin-joao-vitor/`**: Snapshot editorial de inicialização com os dados de João Vitor.
- **`scripts/generate-joao-editorial-snapshot.mjs`**: Script auxiliar para serializar os dados de João Vitor no formato de snapshot do CMS editorial.

---

## 2. Melhorias Técnicas e Correções de Bugs (Código Reutilizável)

Estas melhorias são agnósticas de dados pessoais e corrigem problemas funcionais ou otimizam a arquitetura:

### A. Correção da Navegação no Login Admin (Problema do F5)
- **Arquivo**: `src/app/features/admin/authentication/admin-authentication.ts` e `src/app/core/auth/admin-auth.models.ts`
- **Problema**: Ao inserir as credenciais corretas na rota `/admin`, o painel às vezes não redirecionava para a tela logada (`/admin/content`) sem que o usuário recarregasse a página manualmente (F5).
- **Solução**:
  - Adicionado efeito reativo que observa o estado de autenticação (`AdminAuthService.sessionState`).
  - Se a sessão for resolvida com sucesso ou o usuário já estiver autenticado, o redirecionamento para a rota pós-login é disparado imediatamente via Angular Router.
  - Testes unitários atualizados em `admin-authentication.spec.ts`.

### B. Suporte a Novas Chaves do Supabase (`SUPABASE_PUBLISHABLE_KEY`)
- **Arquivo**: `scripts/generate-runtime-config.mjs`
- **Problema**: O Supabase atualizou o padrão de chaves para chaves publicáveis (`sb_publishable_...`). Projetos mais recentes usam `SUPABASE_PUBLISHABLE_KEY` no `.env`.
- **Solução**: O script agora detecta `SUPABASE_PUBLISHABLE_KEY` ou `SUPABASE_ANON_KEY`, garantindo compatibilidade reversa automática sem quebrar ambientes antigos.

### C. Conexão do Site Público às Publicações Editoriais (Adapter Pattern)
- **Arquivos**:
  - `src/app/features/portfolio/content/editorial-snapshot-adapter.ts`
  - `src/app/features/portfolio/content/editorial-snapshot-adapter.spec.ts`
  - `src/app/features/portfolio/content/portfolio-content.service.ts`
- **Solução**:
  - Implementado o `EditorialSnapshotAdapter` para converter o payload retornado pela RPC `get_versioned_public_portfolio` na estrutura que os componentes da página pública consomem (`PortfolioContent`).
  - Se o Supabase estiver configurado e com publicação ativa, o site público reflete automaticamente o conteúdo publicado no editor visual. Caso contrário, mantém fallback limpo para o conteúdo estático local.

### D. Limpeza e Otimização da Suíte de Testes
- **Arquivos removidos**:
  - `spec/05-verificacao/edicao-visual-rascunho-publicacao/initial-editorial-snapshot-v1.json` (removido arquivo obsoleto de 92 KB com dados legados).
  - `src/app/features/portfolio/content/initial-editorial-snapshot.spec.ts` (teste acoplado a dados do autor original).
  - `src/app/features/admin/media-management/editorial-media.models.spec.ts` (teste redundante de tipagem pura).
  - `src/app/features/admin/visual-editor/editorial-language.service.spec.ts` (teste trivial de 10 linhas coberto por outros testes).
  - `src/app/features/portfolio/content/portfolio-language-storage.spec.ts` e `portfolio-language.spec.ts` (subsumidos pelo teste do serviço `portfolio-language.service.spec.ts`).
- **Arquivos criados/ajustados**:
  - `src/app/features/portfolio/content/initial-editorial-snapshot-joao.spec.ts` (validação de integridade do snapshot de João).
  - `src/app/features/portfolio/content/editorial-snapshot-adapter.spec.ts` (7 testes garantindo a conversão correta de todos os blocos).
- **Impacto**:
  - De 31 para 26 arquivos de teste.
  - 135 testes executando em ~3.5 segundos, sem testes inúteis ou duplicados.
  - Zero falhas na suíte de testes.

---

## 3. Garantia de Segurança e Dados Sensíveis

- **Nenhum arquivo `.env` ou credencial privada foi versionado.** O `.gitignore` ignora `.env*` e `/public/runtime-config.js`.
- Nenhum script SQL solto foi deixado poluindo a raiz do repositório.
