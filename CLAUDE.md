# CLAUDE.md — WhyMeApp

Plataforma SaaS de reclutamiento con matching de personalidad OCEAN (Big Five).
Equipo frontend: Rodrigo (owner) + Lucas Fonseca. Claude Code es el agente principal de desarrollo.

---

## Stack verificado

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14.2, React 18.3, TypeScript, App Router |
| Estilos | Tailwind CSS 3.4.4 (dark mode por clase, HSL variables) |
| Iconos | Lucide React 0.400.0 |
| Visualización | D3.js 7.9, SVG custom (gráficos OCEAN) |
| PDF | jsPDF 4.2.1 |
| API calls | `fetch` nativo con wrapper en `lib/api.ts` |
| Auth | Manual via `localStorage` (`whyme_token`, `whyme_user`) — NO NextAuth |
| Backend | FastAPI en `localhost:8000` (`NEXT_PUBLIC_API_URL`) |
| ML Service | `localhost:8001` |

---

## Estructura de carpetas

```
apps/web/
├── app/                        # Rutas Next.js (App Router)
│   ├── page.tsx                # Home (marketing, completo)
│   ├── login/page.tsx          # Login (completo, conectado a API)
│   ├── register/page.tsx       # Register (completo, conectado a API)
│   ├── faq/page.tsx            # FAQ (completo, estático, en portugués)
│   ├── privacy/page.tsx        # Privacy + LGPD (completo)
│   ├── terms/page.tsx          # Terms (completo)
│   ├── accessibility/          # SKELETON
│   ├── notifications/          # SKELETON o incompleto
│   ├── sitemap/                # SKELETON o incompleto
│   ├── candidate/[id]/
│   │   ├── dashboard/          # COMPLETO (matches, OCEAN radar)
│   │   ├── onboarding/         # COMPLETO (6 pasos)
│   │   ├── profile/            # COMPLETO (upload CV, edición)
│   │   ├── report/             # VERIFICAR
│   │   └── orbita/             # VERIFICAR
│   ├── company/
│   │   ├── onboarding/         # COMPLETO (3 pasos, cultura)
│   │   ├── orbita/             # VERIFICAR
│   │   └── [id]/
│   │       ├── dashboard/      # PARCIAL (filtros OCEAN implementados)
│   │       ├── jobs/           # SKELETON / INCOMPLETO
│   │       └── profile/        # SKELETON / INCOMPLETO
│   ├── interview/[id]/         # COMPLETO (cuestionario OCEAN, validación token)
│   ├── questionnaire/[id]/     # COMPLETO (30 preguntas Likert)
│   └── privacy/consent/        # VERIFICAR
├── components/
│   ├── ui/                     # LoadingSpinner, ErrorState, Button, Card, etc.
│   ├── ocean/                  # OceanRadar, OceanBars
│   └── layouts/                # DashboardLayout, AuthLayout, PublicLayout
├── lib/
│   └── api.ts                  # Cliente API único (~500 líneas, 40+ endpoints)
└── public/
```

---

## Convenciones de código

### Autenticación
```typescript
// Patrón estándar para obtener usuario autenticado en cualquier página
const token = localStorage.getItem('whyme_token')
const userStr = localStorage.getItem('whyme_user')
if (!token || !userStr) { router.push('/login'); return }
const user = JSON.parse(userStr)
```

### Llamadas a la API
```typescript
// SIEMPRE usar las funciones de lib/api.ts, nunca fetch directo
import { getCandidateProfile, updateCandidateProfile } from '@/lib/api'

// Las funciones ya manejan el Bearer token internamente
const data = await getCandidateProfile(candidateId)
```

### Estilos
- Tailwind inline en JSX, sin CSS modules
- Clases de dark mode: `dark:bg-gray-900 dark:text-white`
- Clases de accesibilidad ya definidas en globals.css: `high-contrast-mode`, `large-text-mode`, `reduced-animations-mode`
- Colores semánticos via HSL variables CSS (definidas en globals.css)
- Slider custom: clase `ocean-slider` para inputs range del cuestionario

### Componentes
- Todos los componentes son Client Components por defecto (usan `useState`, `useEffect`)
- Añadir `'use client'` al inicio de cada archivo de página/componente
- No usar React Query ni SWR — fetch nativo con `useState` + `useEffect`
- No usar Redux ni Zustand — estado local con `useState`

### Naming
- Archivos de página: `page.tsx` (convención Next.js App Router)
- Componentes: PascalCase (`CandidateCard.tsx`)
- Funciones: camelCase (`handleSubmit`, `fetchCandidateData`)
- Variables de estado: `[value, setValue]` patrón estándar

---

## Estado actual del proyecto (mayo 2026)

### Completado — Sistema de diseño + refactorizaciones

**Componentes creados en `components/`:**
- `ui/`: LoadingSpinner, ErrorState, Card, SectionLabel, EmptyState, StatusBadge, Button, Avatar, Input
- `ocean/`: OceanRadar, OceanBars, normalizeOceanScores, OCEAN_DIMS
- `layouts/`: DashboardLayout, AuthLayout, PublicLayout

**Páginas refactorizadas — Fase 3 COMPLETADA:**
- `/login` → AuthLayout + Button + Input
- `/register` → AuthLayout + Button + Input
- `/candidate/[id]/dashboard` → DashboardLayout + OceanRadar/OceanBars + StatusBadge + Avatar + EmptyState
- `/candidate/[id]/profile` → LoadingSpinner + ErrorState + Button + OceanRadar (shared)
- `/candidate/[id]/onboarding` → LoadingSpinner + ErrorState
- `/candidate/orbita` → LoadingSpinner + ErrorState + EmptyState
- `/company/[id]/dashboard` → LoadingSpinner + ErrorState + EmptyState
- `/company/[id]/profile` → LoadingSpinner + ErrorState + Button
- `/company/[id]/jobs` → LoadingSpinner + ErrorState + EmptyState + Button
- `/company/onboarding` → LoadingSpinner + ErrorState
- `/company/orbita` → LoadingSpinner + ErrorState
- `/notifications` → LoadingSpinner + ErrorState + EmptyState + Button
- `/faq` → PublicLayout
- `/terms` → PublicLayout

**Intencionalmente sin refactorizar:**
- `/candidate/[id]/report` — fondo blanco (print-optimized), no usar componentes dark
- `/interview/[id]` — accessibility-specialized, los estados dependen de AccommodationsData
- `/questionnaire/[id]` — amber branding propio (página pública, identidad distinta)
- `/privacy` — documento-style con TOC, layout diferente a PublicLayout
- `/accessibility` — página especializada en a11y

### Completado (60-70% del producto)
- Flujo candidato completo: onboarding → cuestionario → dashboard → matches
- Flujo entrevista: validación token → cuestionario OCEAN → conversión
- Auth: login, register, routing por rol (candidate/company)
- Páginas marketing: home, FAQ, privacy (LGPD), terms
- API client completo con todos los tipos TypeScript

### Por hacer (fases restantes)
- **Fase 7** — Revisión integración API completa (endpoints, tipos, error handling)
- **Fase 8** — QA y pulido (flujos completos, mobile, edge cases)
- Empresa dashboard — pipeline de candidatos incompleto
- Candidate report — verificar estado completo

### Deuda técnica conocida
- No hay rutas protegidas en el servidor (todo es client-side check)
- No hay refresh token — si expira el token, el usuario pierde la sesión
- No hay manejo de errores global — cada página maneja errores localmente

---

## Patrones de diseño visual (a respetar)

El diseño real del código usa (verificado):
- **Fondo oscuro**: `bg-zinc-950` (no gray-900)
- **Cards/sidebar**: `bg-zinc-900`, border `border-zinc-800`
- **Elemento secundario**: `bg-zinc-800`
- **Texto**: `text-zinc-50` / `text-zinc-300` / `text-zinc-400` / `text-zinc-500`
- **Acento principal**: `bg-blue-600`, `text-blue-400`
- **Botones primarios**: `bg-blue-600 text-white font-semibold`
- **Gráficos OCEAN**: SVG custom, colores violet/purple (`#8B5CF6`, `bg-violet-500`)

---

## API — endpoints clave

Todos en `lib/api.ts`. Base: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

```typescript
// Candidatos
getCandidateProfile(id)
updateCandidateProfile(id, data)
getCandidateMatchDetails(id)
uploadCandidateResume(id, file)

// Empresas
getCompanySummary(id)
getCompanyJobs(id)
createJob(id, data)

// Auth
loginUser(email, password)
registerUser(data)
getCurrentUser(token)

// Entrevistas
validateToken(token)
submitQuestionnaire(data)
convertCandidate(data)
```

---

## Componentes del sistema de diseño (Fase 1 — completado)

### UI base — `@/components/ui`
```typescript
import { LoadingSpinner } from "@/components/ui"   // full-page loading
import { ErrorState }     from "@/components/ui"   // full-page error + retry
import { Card }           from "@/components/ui"   // card con padding sm/md/lg
import { SectionLabel }   from "@/components/ui"   // título de sección uppercase
import { EmptyState }     from "@/components/ui"   // estado vacío con ◎ y texto
import { StatusBadge }    from "@/components/ui"   // badge pending/accepted/rejected/bilateral
import { Button }         from "@/components/ui"   // btn primary/secondary/ghost/outline/danger
import { Avatar }         from "@/components/ui"   // avatar inicial — variantes blue/violet/zinc
```

### OCEAN — `@/components/ocean`
```typescript
import { OceanRadar, OceanBars, OCEAN_DIMS, normalizeOceanScores } from "@/components/ocean"
// OceanRadar: SVG pentagonal, prop size (default 250)
// OceanBars: barras por dimensión con % y etiqueta
```

### Layouts — `@/components/layouts`
```typescript
import { DashboardLayout } from "@/components/layouts"
// Props: sidebar (ReactNode), title, subtitle?, logoText?, logoHref?, sidebarWidth?
// Patrón: aside sticky + header sticky + main content

import { AuthLayout } from "@/components/layouts"
// Props: title, subtitle?, footer? — card centrado en pantalla

import { PublicLayout } from "@/components/layouts"
// Props: maxWidth? — nav + footer automáticos
```

### Paleta de colores verificada (lo que usa el código real)
| Rol | Clase Tailwind |
|---|---|
| Fondo principal | `bg-zinc-950` |
| Card / sidebar | `bg-zinc-900` |
| Elemento secundario | `bg-zinc-800` |
| Borde | `border-zinc-800` / `border-zinc-700` |
| Texto primario | `text-zinc-50` |
| Texto secundario | `text-zinc-300` / `text-zinc-400` |
| Texto muted | `text-zinc-500` / `text-zinc-600` |
| Acento principal | `bg-blue-600` / `text-blue-400` |
| OCEAN / visualización | `bg-violet-500` / `stroke #8B5CF6` |
| Success | `text-green-400` |
| Warning | `text-yellow-400` |
| Danger | `text-red-400` |
| Match bilateral | `text-purple-400` |

---

## Comandos de desarrollo

```bash
# Desde la raíz del monorepo
cd apps/web && npm run dev        # Frontend en :3000
cd apps/api && uvicorn main:app   # Backend en :8000

# Docker completo
docker-compose up -d
```

---

## Reglas para Claude Code

1. **Nunca usar NextAuth** — la auth es manual via localStorage (ver patrón arriba)
2. **Nunca instalar React Query / SWR / Axios** — usar fetch nativo de lib/api.ts
3. **Nunca crear CSS modules** — solo Tailwind inline
4. **Siempre añadir `'use client'`** en páginas y componentes con estado
5. **Mantener el esquema de colores zinc/blue/dark** — fondo zinc-950, acento blue-600, violet para OCEAN. El amber solo se usa en `/questionnaire` (página pública con identidad propia)
6. **Antes de crear un componente nuevo**, verificar si ya existe algo similar en las páginas existentes que se pueda extraer
7. **El idioma del código es portugués de Brasil** para textos UI visibles al usuario (FAQ, labels, mensajes de error)
8. **Inglés** para nombres de variables, funciones, tipos y comentarios de código
