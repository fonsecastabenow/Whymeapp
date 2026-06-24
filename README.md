# Whyme

Plataforma SaaS de recrutamento baseada em compatibilidade de valores e personalidade usando o modelo **OCEAN** (Big Five).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind, shadcn/ui) |
| Backend | FastAPI (Python 3.11+, Pydantic v2, SQLAlchemy async) |
| Banco de dados | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| ML | PyTorch + Transformers + sentence-transformers |
| Tipos compartilhados | Zod (TypeScript) |
| Build | Turborepo |

## Estrutura

```
whyme/
├── apps/
│   ├── web/          # Next.js 14 — interface do usuário
│   └── api/          # FastAPI — API REST
├── packages/
│   └── shared/       # Zod schemas e tipos TypeScript compartilhados
├── services/
│   └── ml/           # Serviço de ML: scorer OCEAN e embeddings
└── docker/
    └── docker-compose.yml
```

## Como rodar

### Pré-requisitos

- Node.js >= 18
- Python 3.11+
- Docker e Docker Compose

### Desenvolvimento local (com Docker)

```bash
cp .env.example .env

# Sobe todos os serviços (postgres, redis, api, web, ml)
docker compose -f docker/docker-compose.yml up --build
```

Serviços disponíveis:

| Serviço | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| ML | http://localhost:8001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Desenvolvimento sem Docker

```bash
# Instala dependências Node (frontend + shared)
npm install

# Roda frontend e shared em modo watch
npm run dev

# Em outro terminal — API
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Em outro terminal — ML
cd services/ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8001
```

## Modelo OCEAN

O Whyme usa o modelo **Big Five** para calcular compatibilidade entre candidatos e empresas:

| Dimensão | Sigla | Descrição |
|----------|-------|-----------|
| Openness | O | Abertura a novas experiências |
| Conscientiousness | C | Organização e responsabilidade |
| Extraversion | E | Sociabilidade e energia |
| Agreeableness | A | Cooperação e empatia |
| Neuroticism | N | Estabilidade emocional |

A pontuação de match é calculada via similaridade de cosseno ponderada entre os vetores OCEAN do candidato e da vaga.

## Variáveis de Ambiente

Copie `.env.example` e ajuste conforme necessário:

```bash
POSTGRES_USER=whyme
POSTGRES_PASSWORD=whyme
POSTGRES_DB=whyme
NEXT_PUBLIC_API_URL=http://localhost:8000
```
