# Onboarding Rodrigo — Whymeapp

## 1. Acessos

### GitHub (Lucas precisa adicionar)
- Repositório: **github.com/fonsecastabenow/Whymeapp**
- Adicionar Rodrigo como **Collaborator** (nível Write):
  1. Ir em Settings → Collaborators → Add people
  2. Email/GitHub do Rodrigo
  3. Enviar convite

### API (documentação — não precisa de acesso)
- **Swagger UI**: https://whymeapp.io/docs
- **OpenAPI JSON**: https://whymeapp.io/openapi.json
- Toda a API está documentada aqui: endpoints, schemas, exemplos
- Pode usar essa URL pra testar chamadas direto do navegador

---

## 2. Clonar e rodar local

```bash
# Clone
git clone https://github.com/fonsecastabenow/Whymeapp.git
cd Whymeapp

# Criar branch de trabalho (NUNCA mexer em main)
git checkout -b feat/frontend-renovado

# Instalar dependências
npm install

# Rodar frontend standalone (sem Docker, só o Next)
cd apps/web
cp .env.example .env.local  # Ajustar se precisar
npm run dev
```

O frontend roda em **http://localhost:3000** e já aponta pra API em https://whymeapp.io/api

---

## 3. Regras de ouro

### 🚫 NUNCA fazer push direto pra main
Sempre trabalhar em branch separada (`feat/frontend-*`, `fix/*`, etc.)

### ✅ Fluxo correto
1. Branch própria
2. Desenvolve e testa local
3. Commit → Push
4. Abre **Pull Request** no GitHub para `main`
5. O CI roda lint automaticamente no PR
6. Lucas revisa e aprova
7. Merge → deploy automático no servidor

### 🔒 O que NÃO subir pro GitHub
O `.gitignore` já protege:
- `.env` (senhas, tokens)
- `node_modules/`
- `.next/` (build local)
- Qualquer arquivo com credenciais

---

## 4. Estrutura do projeto

```
Whymeapp/
├── apps/
│   ├── web/              ← TU MEXE AQUI (Next.js 14, App Router)
│   │   ├── app/           → Páginas e rotas
│   │   ├── components/    → Componentes React
│   │   └── lib/           → Hooks, utils, API calls
│   └── api/               → FastAPI (backend - NÓS mexemos)
├── packages/
│   └── shared/            ← Tipos COMPARTILHADOS (Zod)
├── services/
│   ├── ml/                → ML OCEAN
│   └── telegram-bot/      → Bot Telegram
├── docker-compose.yml     → Sobe tudo (uso do servidor)
├── turbo.json             → Build orchestration
└── .github/workflows/     → CI/CD automático
```

### Importante: `packages/shared/`
Esse diretório contém schemas Zod compartilhados entre frontend e backend.
Se precisar de um tipo novo (ex: formato de vaga, candidato), avisa que a gente cria aqui. Assim os 2 lados usam a mesma definição.

---

## 5. API — rotas principais

A API completa está em https://whymeapp.io/docs. Rotas principais:

| Rota | Descrição |
|------|-----------|
| `POST /auth/register` | Registro (candidato/empresa) |
| `POST /auth/login` | Login → retorna JWT |
| `GET /companies/me` | Perfil da empresa logada |
| `GET /companies/{id}` | Perfil público empresa + cultura OCEAN |
| `GET /candidates/me` | Perfil do candidato logado |
| `POST /candidates/ocean` | Enviar respostas OCEAN → retorna scores |
| `GET /matches/company/{id}` | Matches da empresa |
| `POST /jobs` | Criar vaga (empresa) |
| `GET /jobs` | Listar vagas |
| `GET /jobs/{id}` | Vaga específica |

Todas as rotas aceitam:
- `Content-Type: application/json`
- Autenticação: `Authorization: Bearer <token>` (exceto register/login)

---

## 6. Dicas rápidas

- **Frontend já existe** em `apps/web/` — pode usar como base ou refatorar
- **Componentes**: shadcn/ui + Tailwind + TypeScript
- **API calls**: usar fetch padrão ou axios, o endpoint base é `https://whymeapp.io/api`
- **Testar integração**: depois de alterar o front, testar com `npm run build` antes do PR
- **Dúvidas**: perguntar no grupo ou chamar Lucas

---

## 7. Resumo do workflow

```
[Rodrigo]                          [GitHub]                     [Servidor]
   │                                 │                             │
   ├─ git checkout -b feat/x         │                             │
   ├─ desenvolve frontend            │                             │
   ├─ git push origin feat/x ───────►│                             │
   │                                 ├─ Cria PR para main         │
   │                                 ├─ CI roda lint + build      │
   │                                 │                             │
   │                       Lucas revisa e aprova                  │
   │                                 │                             │
   │                                 ├─ Merge ───────────────────►│
   │                                 │                             ├─ git pull
   │                                 │                             ├─ docker compose up
   │                                 │                             └─ deploy ✅
```

---
📝 *Gerado por Jarbas 🤖 — Maio 2026*
