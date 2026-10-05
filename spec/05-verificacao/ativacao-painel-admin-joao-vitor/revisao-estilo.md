# Relatório de Diagnóstico de Estilização e UX — Portfólio João Vitor

Data: 2026-10-05
Feature: `ativacao-painel-admin-joao-vitor`
Status: Verificação concluída

---

## 1. Problemas Concretos de Estilização e Layout

### 1.1. Portfólio Público
- **`src/styles.scss:10-17` — Ausência de Design Tokens Globais e Dark Mode**: Cores e tipografia estão fixadas diretamente no `body` sem variáveis CSS em `:root` e sem suporte a `@media (prefers-color-scheme: dark)`. Isso resulta em paletas isoladas e conflitantes entre módulos (`portfolio-page`, `visual-editor` e `media-management`).
- **`src/app/features/portfolio/presentation/portfolio-page/portfolio-page.scss:18-25, 31` — Header Fixo e Scroll Horizontal no Mobile**: O header possui `position: fixed` com espaçamento compensatório rígido (`margin-top: 4.5rem`). No mobile, o menu usa `overflow-x: auto` sem indicador visual de scroll; se os links quebrarem em linha adicional, cobrem o início do conteúdo da página.
- **`src/app/features/portfolio/presentation/portfolio-page/portfolio-page.scss:105-111, 234-239` — Remoção de Contorno de Foco (`outline: none`)**: Links do menu e cards de contato removem o contorno padrão em `:focus-visible` sem aplicar anel de foco visível próprio, violando acessibilidade de teclado (WCAG 2.4.7 e 2.4.11).
- **`src/app/features/portfolio/presentation/portfolio-page/portfolio-page.scss:211, 462` — Breakpoint Abrupto na Grade de Contato**: `.contact-grid` define 5 colunas fixas até 760px, espremendo excessivamente os cartões em tablets (768px–1024px); abaixo de 760px colapsa direto para 1 coluna sem layout intermediário (2–3 colunas).
- **`src/app/features/portfolio/presentation/portfolio-page/portfolio-page.scss:254` — Largura Máxima Restritiva**: `section p:last-child { max-width: 24rem; }` impõe um limite arbitrário ao último parágrafo de seções genéricas.
- **`src/app/features/portfolio/presentation/projects/project-detail.scss:3-4, 22, 55` — Valores Hexadecimais Hardcoded**: Cores repetidas manualmente (`#f4f1e9`, `#11130f`, `#176b4d`, `#c9c4b7`) sem integração a um tema compartilhado.
- **`src/app/features/portfolio/presentation/projects/project-technologies.ts:41` — Distorção de Logotipo Não Quadrado**: `img { width: 2rem; height: 2rem; object-fit: contain; }` achata logotipos horizontais largos (como `src/assets/technologies/outsystems.png`, proporção ~8:1) em faixas microscópicas e ilegíveis.

---

## 2. Assets Faltantes e Metadados (`index.html`)

- **Ícones de Habilidades Faltantes**: 17 das 30 habilidades em `PORTFOLIO_SKILL_CATEGORIES` (`portfolio-content.ts:105-136`) não possuem mapeamento em `FALLBACK_SKILL_ICON_URLS` nem arquivos em disco:
  - *Linguagens*: Python, PHP, Dart.
  - *Backend*: FastAPI, Spring Boot, Laravel, JSF.
  - *Frontend*: Angular (ausente no próprio portfólio Angular!), Flutter.
  - *DevOps*: Gradle, Maven.
  - *Bancos de Dados*: Supabase, Oracle Database.
  - *Versionamento/Visão*: GitLab, GitKraken, OpenCV, YOLOv8.
  - *Impacto visual*: Em `portfolio-page.html:97-113`, habilidades sem ícone não exibem nenhum placeholder gráfico, deixando a grade de 5.5rem com espaços vazios irregulares.
- **Favicon Padrão**: O arquivo `public/favicon.ico` contém o logo original (escudo rosa/roxo) do Angular CLI.
- **`src/index.html:2-8` — Inconsistências de SEO e Idioma**:
  - Tag `<html lang="en">` diverge do conteúdo padrão em português (`pt-BR`).
  - Ausência de `<meta name="description">`.
  - Ausência de metadados Open Graph (`og:title`, `og:image`, `og:description`) e Twitter Cards.

---

## 3. Problemas de UI na Área Administrativa

- **`src/app/features/admin/admin-page/admin-workspace.ts` — Ausência Total de Estilos**: Não possui folha de estilos associada (`styleUrl` ausente); exibe HTML cru com fontes de sistema e links azuis sem formatação.
- **`src/app/features/admin/authentication/` — Login**:
  - `admin-authentication.scss:55-66`: Inputs sem estilo de `:focus-visible`; botão sem estado `:hover`.
  - `admin-authentication.ts:7, 53-55`: Mensagem de erro única e genérica para qualquer falha (`"Não foi possível autenticar..."`).
  - `admin-authentication.ts:49`: `restoreSession()` tenta navegar para `['/admin', 'area']`, rota inexistente que cai no fallback da raiz.
- **`src/app/features/admin/media-management/` — Gerenciador de Mídias**:
  - *Incoerência Visual*: Usa botões em pílula (`border-radius: 999px`), cards arredondados e paleta lilás/azul (`#7257a3`, `#172033`), rompendo completamente com a identidade editorial/brutalista do portfólio.
  - *Estados Vazios Fracos*: Parágrafos de texto plano (`lines 31, 82, 168`) sem ilustração, container ou botão de ação direta.
  - *Posicionamento de Notificações*: Banners de erro/sucesso no topo (`lines 14-19`), fora da visão ao interagir com formulários na parte inferior.
  - *Upload Cru*: Tags `<input type="file">` sem drag-and-drop, preview imediato ou validação visual de tamanho.

---

## 4. Lista Priorizada de Melhorias Futuras

### Prioridade Alta (Impacto imediato na percepção do portfólio)
1. **Ícones de Habilidades**: Adicionar os 17 ícones de habilidades pendentes (PNG/SVG) e implementar fallback visual elegante (sigla estilizada ou ícone genérico) quando uma skill não possuir imagem.
2. **Identidade e SEO em `index.html`**:
   - Ajustar `lang="pt-BR"`.
   - Adicionar meta description com resumo profissional.
   - Adicionar Open Graph e Twitter Cards para compartilhamento em redes (LinkedIn, WhatsApp).
   - Substituir o favicon padrão do Angular por monograma próprio (ex: "JV").
3. **Estilização de `AdminWorkspace`**: Criar SCSS dedicado com cards, botões padronizados e harmonia visual com o restante do portfólio.

### Prioridade Média (Refinamento de UX e Acessibilidade)
1. **Acessibilidade de Foco**: Restaurar anéis visíveis em `:focus-visible` (WCAG 2.4.7) nos links de navegação e cartões de contato.
2. **Breakpoints Intermediários para Tablets**: Ajustar a grade de contato (`.contact-grid`) e resultados profissionais para 2 ou 3 colunas entre 768px e 1024px.
3. **Upload no Gerenciador de Mídias**: Adicionar área drag-and-drop com preview da imagem antes do envio e validação visual de tamanho.
4. **Mensagens Contextuais no Admin**: Exibir erros específicos (ex: credenciais inválidas vs. rede indisponível vs. arquivo muito grande) próximos ao campo onde a ação ocorreu.

### Prioridade Baixa (Otimizações técnicas e cosméticas)
1. **Dark Mode com Variáveis CSS em `:root`**: Centralizar paleta em variáveis CSS globais e suportar `prefers-color-scheme: dark`.
2. **Otimização do DOM no `#localized`**: Substituir a sobreposição oculta de ambos os idiomas por dimensionamento dinâmico ou CSS subgrid para reduzir nós no DOM e evitar poluição para leitores de tela.
