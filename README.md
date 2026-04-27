<details>
<summary>🇧🇷 Português do Brasil</summary>

# VendeMais CRM Frontend

Interface web do VendeMais CRM voltada para a gestão comercial, acompanhamento de leads e oportunidades, administração de funis de vendas, rotina de tarefas e gestão de usuários.

## Visão geral

- SPA construída com React, Vite e TypeScript.
- Consome uma API REST backend em Spring Boot.
- Usa autenticação JWT com bootstrap de sessão ao carregar a aplicação.
- Possui rotas protegidas para as áreas autenticadas e fluxo exclusivo para convidados na tela de login.
- Trabalha com paginação, filtros, busca, formulários validados e operações de CRUD para os principais domínios comerciais.

## Stack principal

- React 19
- Vite
- TypeScript
- React Router DOM
- Axios
- TanStack React Query
- Zustand
- React Hook Form
- Zod
- Sonner
- Radix UI
- Lucide React
- CSS global em `src/app/styles`
- Fontes via `@fontsource`

## Funcionalidades principais

- Login com sessão autenticada via JWT.
- Dashboard comercial com KPIs, distribuição de oportunidades por etapa, oportunidades recentes e próximas tarefas.
- Gestão de Leads com busca, filtros por tipo de pessoa e origem, paginação, visualização de detalhes e CRUD.
- Gestão de Oportunidades com filtros por status e funil, visualização em tabela e kanban, fechamento de negócio e CRUD.
- Gestão de Funis/Pipelines e Etapas com ações administrativas de criação, edição e exclusão.
- Gestão de Tarefas com vínculo a leads ou oportunidades, filtros por status, prazo e vínculo, além de fluxo de conclusão.
- Gestão de Usuários com filtros por perfil, visualização de detalhes e controles administrativos.
- Feedback visual com loading states, empty states, diálogos de confirmação e notificações toast.

## Estrutura do projeto

```text
src/
  app/             bootstrap da aplicação, providers, Query Client e estilos globais
  assets/          arquivos estáticos
  components/      layout compartilhado e componentes de UI reutilizáveis
  features/        módulos por domínio (auth, dashboard, leads, opportunities, pipelines, tasks, users)
  hooks/           hooks de autenticação e utilitários
  routes/          configuração de rotas
  services/
    api/           serviços por recurso da API
    http/          cliente HTTP, token, paginação e tratamento de erros
  types/           DTOs e contratos da API
  utils/           constantes, formatação, permissões e helpers de formulário
```

## Integração com backend

- A URL base da API é configurada por `VITE_API_BASE_URL`.
- O login espera o JWT no header `Authorization` da resposta e persiste o token no `localStorage`.
- Requisições autenticadas enviam `Authorization: Bearer <token>` automaticamente via interceptor do Axios.
- Respostas `401 Unauthorized` limpam a sessão local e redirecionam o usuário para `/login`.
- As listagens consomem respostas paginadas tipadas como `PageResponse<T>`.
- O frontend possui serviços dedicados para autenticação, dashboard, leads, opportunities, pipelines, stages, tasks e users.
- Erros do backend são normalizados a partir de respostas padrão e de validação, com suporte a mensagens por campo em formulários.

## Variáveis de ambiente

```env
VITE_API_BASE_URL=http://localhost:8080
```

Use placeholders locais ou valores do ambiente de implantação. Não versione segredos, tokens ou credenciais.

## Como executar

1. Instale as dependências com `npm install`.
2. Configure a variável `VITE_API_BASE_URL` para o backend desejado.
3. Inicie o ambiente de desenvolvimento com `npm run dev`.

## Scripts disponíveis

- `npm run dev`: inicia o servidor de desenvolvimento com Vite.
- `npm run build`: executa `tsc --noEmit` e gera o build de produção.
- `npm run lint`: roda o ESLint.
- `npm run typecheck`: valida os tipos TypeScript.
- `npm run preview`: sobe localmente o build gerado.

</details>

<details>
<summary>🇺🇸 English</summary>

# VendeMais CRM Frontend

Web interface for VendeMais CRM focused on commercial operations, lead and opportunity tracking, sales pipeline administration, task routines, and user management.

## Overview

- SPA built with React, Vite, and TypeScript.
- Consumes a Spring Boot REST backend.
- Uses JWT authentication with session bootstrap when the application loads.
- Provides protected routes for authenticated areas and a guest-only login flow.
- Works with pagination, filters, search, validated forms, and CRUD operations for the main commercial domains.

## Main stack

- React 19
- Vite
- TypeScript
- React Router DOM
- Axios
- TanStack React Query
- Zustand
- React Hook Form
- Zod
- Sonner
- Radix UI
- Lucide React
- Global CSS in `src/app/styles`
- Fonts via `@fontsource`

## Core features

- Login flow with authenticated JWT session.
- Commercial dashboard with KPIs, opportunity stage distribution, recent opportunities, and upcoming tasks.
- Lead management with search, person type and source filters, pagination, detail views, and CRUD.
- Opportunity management with status and pipeline filters, table and kanban views, deal closing, and CRUD.
- Pipeline and stage management with administrative create, edit, and delete actions.
- Task management linked to leads or opportunities, with status, deadline, and relation filters plus completion workflow.
- User management with role filters, detail views, and administrative controls.
- Visual feedback through loading states, empty states, confirmation dialogs, and toast notifications.

## Project structure

```text
src/
  app/             application bootstrap, providers, Query Client, and global styles
  assets/          static assets
  components/      shared layout and reusable UI components
  features/        domain modules (auth, dashboard, leads, opportunities, pipelines, tasks, users)
  hooks/           authentication and utility hooks
  routes/          route configuration
  services/
    api/           API resource services
    http/          HTTP client, token storage, pagination, and error handling
  types/           API DTOs and contracts
  utils/           constants, formatting, permissions, and form helpers
```

## Backend integration

- The API base URL is configured through `VITE_API_BASE_URL`.
- The login flow expects the JWT in the response `Authorization` header and stores it in `localStorage`.
- Authenticated requests automatically send `Authorization: Bearer <token>` through an Axios interceptor.
- `401 Unauthorized` responses clear the local session and redirect the user to `/login`.
- List endpoints consume paginated responses typed as `PageResponse<T>`.
- The frontend includes dedicated services for authentication, dashboard, leads, opportunities, pipelines, stages, tasks, and users.
- Backend errors are normalized from standard and validation payloads, with field-level support for forms.

## Environment variables

```env
VITE_API_BASE_URL=http://localhost:8080
```

Use local placeholders or deployment-specific values. Do not commit secrets, tokens, or credentials.

## Running locally

1. Install dependencies with `npm install`.
2. Set `VITE_API_BASE_URL` for the target backend.
3. Start the development server with `npm run dev`.

## Available scripts

- `npm run dev`: starts the Vite development server.
- `npm run build`: runs `tsc --noEmit` and generates the production build.
- `npm run lint`: runs ESLint.
- `npm run typecheck`: validates TypeScript types.
- `npm run preview`: serves the generated build locally.

</details>
