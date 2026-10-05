# Plano de Implementação — Adaptação do Portfólio para João Vitor Dias Fernandes

Spec relacionada: `spec/03-features/adaptacao-portfolio-joao-vitor/spec.md`  
Tarefas: `spec/04-plano/adaptacao-portfolio-joao-vitor/tarefas.md`

## 1. Visão Geral

Este plano descreve as etapas necessárias para substituir completamente a identidade, informações profissionais, projetos e canais de contato de Marcos Santos por João Vitor Dias Fernandes.

A estratégia adota duas frentes complementares:
1. **Frontend Resiliente (Fallbacks Locais)**: Atualização imediata dos arquivos de dados estáticos do Angular para garantir que o portfólio funcione localmente e em qualquer ambiente de build.
2. **Backend Dedicado (Supabase)**: Configuração de um script SQL pronto para ser executado no SQL Editor do novo projeto Supabase (`efxcpncyzqtfaewdbaar`), inicializando o schema e os dados de João Vitor com segurança e isolamento total.

---

## 2. Ordem de Execução

1. **Fase 1 — Base e Recursos Estáticos**:
   - Cópia dos currículos em PDF para `public/` para download imediato.
   - Ajuste em `generate-runtime-config.mjs` para ler `.env` automaticamente no Node 24.
2. **Fase 2 — Domínio de Conteúdo**:
   - Atualização de `portfolio-content.ts` (PT) e `portfolio-translations.ts` (EN).
   - Ajuste de dados de fallback para experiências e projetos.
3. **Fase 3 — Banco de Dados Supabase Próprio**:
   - Criação de `supabase/joao_vitor_setup.sql` unificado para execução no painel Supabase.
4. **Fase 4 — Validação e Testes**:
   - Execução de `npm test` e `npm run build`.
