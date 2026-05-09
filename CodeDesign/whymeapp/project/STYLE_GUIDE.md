# WhyMe — Estilo visual da plataforma (v1)

Documento de referência para aplicar o mesmo estilo do protótipo "Top Candidatos por Vaga" em todas as páginas do produto. Baseado em `apps/web/app/globals.css` + extensões usadas em `index.html` (este projeto).

> **Stack alvo:** Next.js 14 + Tailwind 3.4 + componentes em `components/ui` e `components/ocean`. Os tokens abaixo já existem como CSS variables em HSL — preferir SEMPRE variáveis a hex inline.

---

## 1. Filosofia visual

- **Aesthetic:** "command-center espacial". Fundo navy profundo, linhas elétricas tênues, dados em destaque, OCEAN como elemento orbital.
- **Hierarquia:** títulos curtos, mono para números, eyebrow uppercase com tracking 0.16em em azul translúcido.
- **Densidade:** generosa por padrão (cards 18–24 px de raio, padding 22 px). Compacto só sob tweak.
- **Movimento:** transições 150–300 ms, easing `cubic-bezier(.2,.8,.2,1)`. Pulse sutil só em estados ativos (match recíproco).
- **Não fazer:** gradientes saturados full-bleed, ícones decorativos, emojis, sombras pretas duras, cantos sharp em superfícies grandes.

---

## 2. Tokens — cores

```css
/* Já em globals.css, manter HSL */
--background: 220 38% 11%;       /* #0B1F3A  navy profundo */
--foreground: 0 0% 98%;
--card:       220 32% 15%;       /* #102244  superfície elevada */
--secondary:  220 26% 18%;       /* superfície 2 */
--muted:      220 32% 15%;
--muted-foreground: 215 16% 55%; /* #94A3B8 */
--primary:    204 100% 61%;      /* #3AB0FF  azul elétrico */
--accent:     204 100% 61%;
--border:     220 20% 25%;
--destructive: 0 84% 60%;
--radius:     0.625rem;
```

### Camadas de superfície (rgba)

| Token | Valor | Uso |
|---|---|---|
| `--surface`   | `rgba(16, 34, 68, 0.78)` | cards principais (com blur) |
| `--surface-2` | `rgba(20, 42, 80, 0.62)` | cards secundários |
| `--surface-3` | `rgba(8, 22, 46, 0.72)`  | inputs, chips, side-cards |
| `--line`        | `rgba(58,176,255,0.12)` | borders padrão |
| `--line-strong` | `rgba(58,176,255,0.22)` | hover/foco |
| `--line-soft`   | `rgba(58,176,255,0.06)` | divisores internos |
| `--primary-soft` | `rgba(58,176,255,0.10)` | hover de itens nav |

### Texto

- **Primário:** `text-foreground` (`#F5F8FF`).
- **Secundário:** `--fg-2 = #C8D5EA` (corpo, labels).
- **Muted:** `--fg-3 = rgba(200,213,234,0.62)` (meta, timestamps).
- **Hint/disabled:** `rgba(200,213,234,0.42)`.

### Cores OCEAN (fixas, não tweakáveis)

| Dim | Hex | CSS var |
|---|---|---|
| O — Abertura | `#8B5CF6` | `--o` |
| C — Conscienciosidade | `#3B82F6` | `--c` |
| E — Extroversão | `#F59E0B` | `--e` |
| A — Amabilidade | `#10B981` | `--a` |
| N — Neuroticismo | `#EF4444` | `--n` |

### Cores de status / score

| Estado | Hex |
|---|---|
| Sucesso (≥85% match) | `#38d391` |
| OK (70–84%) | `#3AB0FF` |
| Atenção (55–69%) | `#f5b454` |
| Crítico (<55%) | `#f06b6b` |

Aplicar via helper:
```ts
function scoreColor(pct: number) {
  if (pct >= 85) return "#38d391";
  if (pct >= 70) return "#3AB0FF";
  if (pct >= 55) return "#f5b454";
  return "#f06b6b";
}
```

### Acento alternativo (tweak global, opcional)

| Tema | primary | primary-2 | line |
|---|---|---|---|
| **Blue** (default) | `#3AB0FF` | `#1a8fdb` | `rgba(58,176,255,…)` |
| Violet | `#A78BFA` | `#7C3AED` | `rgba(167,139,250,…)` |
| Mint | `#34D399` | `#0F9C6F` | `rgba(52,211,153,…)` |

---

## 3. Tipografia

- **Sans:** `Inter` (400/500/600/700/800/900). Carregar de Google Fonts. Feature settings `"ss01","cv11"`.
- **Mono:** `JetBrains Mono` (400/600/800) para números, scores, deltas, IDs, atalhos teclado.
- Letter-spacing negativo em headings: `-0.02em` em h1/h2.
- **Eyebrow / section label:** 11–13 px, `uppercase`, `letter-spacing: 0.16em`, `color: rgba(58,176,255,0.7)`, peso 700.

| Uso | Tamanho | Peso |
|---|---|---|
| h1 (hero) | 30 px | 700 |
| h2 seção | 22 px | 700 |
| h3 card | 17 px | 700 |
| body | 13.5 px | 500 |
| meta / muted | 12 px | 500 |
| eyebrow | 11 px | 700, uppercase, +tracking |
| tabular | mono 14–18 px | 700/800 |

---

## 4. Sistema visual

### Background da app
```css
body {
  background: var(--bg);
  background-image:
    radial-gradient(1100px 600px at 80% -10%, rgba(58,176,255,0.08), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(139,92,246,0.07), transparent 65%);
  background-attachment: fixed;
}
```

### Hero / banner com grid sutil
Sobreposição de grid 28×28 com mask para fade-out. Apenas em hero principal de cada página.
```css
.hero::before {
  content: "";
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(58,176,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58,176,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 80%);
}
```

### Glass card (já existe — `.glass-card` em globals.css)
```css
background: rgba(16,34,68,0.70);
backdrop-filter: blur(20px);
border: 1px solid rgba(58,176,255,0.12);
```

### Border radius
`8` → controles pequenos (chips, kbd, search).
`12` → inputs, stat cards, cards laterais.
`18` → cards de conteúdo principais.
`24` → hero grandes.

### Sombras
- **Default:** `0 4px 24px rgba(0,0,0,0.3)` (`.surface-card`).
- **Hover card:** `0 16px 40px -16px rgba(58,176,255,0.35)` + `translateY(-2px)`.
- **Glow primário:** `0 0 40px rgba(58,176,255,0.18)` (CTAs, item ativo).

---

## 5. Componentes-padrão

### Botões
| Variant | Estilo |
|---|---|
| `btn primary` | `linear-gradient(135deg,#3AB0FF,#1a8fdb)`, texto `#06223e`, sombra azulada |
| `btn ghost` | borda `--line-strong`, hover `--primary-soft` |
| `btn subtle` | borda `--line`, fundo `--surface-3`, texto `--fg-2` |
| `icon-btn` | quadrado 34×34, raio 9, borda `--line` |

Padding: `10px 16px`, raio `10`, peso 600, fonte 13.5 px.

### Chips
| Variant | Border | Bg | Color |
|---|---|---|---|
| default | `--line` | `--surface-3` | `--fg-2` |
| `chip primary` | rgba(58,176,255,0.35) | rgba(58,176,255,0.10) | `#BFE0FF` |
| `chip violet` | rgba(139,92,246,0.35) | rgba(139,92,246,0.10) | `#DDD0FF` |

### Status pills (`status-pill`)
Cinco estados — usar exatamente estas cores. Cada pill tem `<span class="d"/>` 6×6 redondo.

| Status | Texto | Border | Bg | Dot |
|---|---|---|---|---|
| `new` | `#BFE0FF` | rgba(58,176,255,0.35) | rgba(58,176,255,0.08) | `#3AB0FF` |
| `contacted` | `#f5e1a8` | rgba(245,180,84,0.35) | rgba(245,180,84,0.08) | `#f5b454` |
| `interview` | `#DDD0FF` | rgba(139,92,246,0.35) | rgba(139,92,246,0.10) | `#8B5CF6` |
| `advanced` | `#b6e8d2` | rgba(56,211,145,0.35) | rgba(56,211,145,0.08) | `#38d391` |
| `declined` | `#f0bdbd` | rgba(240,107,107,0.30) | rgba(240,107,107,0.06) | `#f06b6b` |

### Score ring
- 76 px default, stroke 6.
- Trilha `rgba(255,255,255,0.06)`, fill = `scoreColor(pct)`.
- Texto centralizado em mono 18 px + `<small>%</small>`.
- `transition: stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)`.

### Avatar
- `lg` 56 px, raio 50%, gradiente diagonal.
- `sm` 36 px, mesmo padrão.
- Borda `2px solid rgba(255,255,255,0.06)`.
- Iniciais em peso 800, cor `#0b1f3a`.

### Layout — DashboardLayout (já existe)
Sidebar 264 px sticky + topbar 64 px sticky com `backdrop-filter: blur(14px)` + content `padding: 28px; max-width: 1480px`.

### Drawer lateral
- `width: min(620px, 100vw)` da direita.
- Backdrop `rgba(4,12,24,0.62)` + blur 6 px.
- Slide com `transform: translateX(...)` e easing `(.2,.8,.2,1)` 300 ms.
- Header com radial gradient sutil; actions-bar sticky no fundo.
- Botão `x` 34×34 no canto superior direito.

### Pipeline / tabela densa
- Grid: `44px 1.6fr 1fr 1fr 100px 120px 36px`, gap 14, padding `14px 18px`.
- Header row em `rgba(0,0,0,0.18)`, eyebrow uppercase.
- Hover row: `rgba(58,176,255,0.05)`.
- Border interno `--line-soft`.

### OCEAN — visualizações (em `components/ocean`)
- **OceanRadar** existente continua canônico para perfil completo.
- Adicionar para v2: **OrbitalViz** (rings + planetas), **ConstellationViz** (linha temporal), **MiniBars** (cards densos), **OceanStrip** (vertical 5-col em listas).
- Sempre opcional: passar `target` para sobrepor perfil-vaga.
- Banda padrão (tolerância): `0.18`.

---

## 6. Iconografia

- **Família:** Lucide React (já no stack), `strokeWidth: 1.6`, `strokeLinecap: round`, `strokeLinejoin: round`.
- Tamanhos: 11/13/14/16 px.
- Cor herda do contexto; meta usa `--fg-3`.
- Sem ícones decorativos — só funcionais.

---

## 7. Estados / interações

- **Toast:** centralizado, `bottom: 24px`, `transform: translateX(-50%)`, ícone esquerda em verde.
- **Empty state:** borda dashed `--line`, texto `--fg-3`.
- **Loading:** spinner já em `LoadingSpinner` — manter.
- **Bilateral match:** badge violeta com pulse animation 1.8 s. Reservar SOMENTE para sinalização de match recíproco.
- **Foco:** `outline: 2px solid var(--primary); outline-offset: 2px;` em inputs/botões.
- **Hover de card clicável:** `translateY(-2px)` + border `--line-strong` + sombra azul.

---

## 8. Acessibilidade — manter

- Classes `.high-contrast-mode`, `.large-text-mode`, `.reduced-animations-mode` existentes em `globals.css` continuam canônicas.
- Hit targets ≥ 44 px em mobile.
- Texto mínimo 12 px em UI interna; 14 px em conteúdo.
- Contraste mínimo 4.5:1 — verificar texto sobre `--surface` (já passa).

---

## 9. Convenções de página

Toda página segue esta espinha:

1. `DashboardLayout` (com sidebar + topbar).
2. **Hero** opcional com grid pattern + KPIs à direita.
3. **Filter bar** sticky com seg-control, sort pill, density toggle.
4. **Section eyebrow** + linha gradiente (`<div class="podium-label">`).
5. **Conteúdo principal** (cards/tabela).
6. **Divider** (`linear-gradient` horizontal) entre seções grandes.
7. **Footer institucional** em mono micro 11.5 px (versão / hash / LGPD).

Page padding: 28 px desktop, 18 px ≤ 700 px.

---

## 10. Don'ts

1. Não usar Tailwind `bg-zinc-*` — substituir por `--background`/`--surface*`. (CLAUDE.md menciona zinc, mas o código real é navy.)
2. Não inventar novas cores fora desta paleta — usar `oklch()` se precisar harmonizar.
3. Não usar gradientes em texto longo. Só em logo `WHY ME?`, scores e CTAs.
4. Não usar emoji.
5. Não usar bordas left-accent estilo "callout AI". Para destaque, usar inset shadow `inset 2px 0 0 var(--primary)`.
6. Não desenhar SVGs ilustrativos à mão — usar placeholders listrados ou ícones Lucide.
7. Não ultrapassar 3 fontes nem 2 acentos por viewport.

---

## 11. Aplicação rápida em página existente

Checklist quando portar uma página:

- [ ] Substituir `bg-zinc-950 → bg-background`, `bg-zinc-900 → bg-card / surface`, etc.
- [ ] Trocar `text-zinc-*` por `text-foreground / muted-foreground`.
- [ ] Adicionar gradients radiais no body (uma vez, em layout root).
- [ ] Hero: usar grid pattern + KPI grid à direita.
- [ ] Tabelas → padrão `pipeline` (header eyebrow + grid linhas).
- [ ] Cards → border `--line`, hover lift, raio 18.
- [ ] CTAs → `btn primary` com glow.
- [ ] Status → `status-pill` com 5 variantes.
- [ ] Score numérico → `score-ring` 76 px ou `score-cell` linear (mono 14 px + bar 6 px).
- [ ] Drawer lateral em vez de modal sempre que possível.

---

> Arquivos de referência neste projeto:
> - `styles.css` — implementação completa dos tokens e componentes.
> - `index.html` + `app.jsx` + `ocean-viz.jsx` + `icons.jsx` — protótipo aplicando o sistema.
> - `data.jsx` — fixtures PT-BR seguindo as convenções de copy.
