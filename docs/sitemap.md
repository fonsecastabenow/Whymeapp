# 🗺️ Mapa do Site — Whyme

> **Legenda:** ✅ Existe  |  🔧 Precisa criar  |  🎯 Prioridade

---

## 🌐 Público — Landing & Institucional

| Rota | Status | Descrição |
|------|--------|-----------|
| `/` | ✅ | Home — Landing page com hero, OCEAN explanation, CTA |
| `/login` | ✅ | Login (email+senha ou magic link) |
| `/register` | ✅ | Cadastro — escolhe rota: Candidato ou Empresa |
| `/faq` | ✅ | FAQ / Dúvidas frequentes |
| `/terms` | ✅ | Termos de uso |
| `/privacy` | ✅ | Política de privacidade |
| `/privacy/consent` | ✅ | Consentimento LGPD |
| `/accessibility` | ✅ | Acessibilidade |
| `/not-found` | ✅ | Página 404 personalizada |
| 🔧 `/pricing` | **🔧 Alta** | Planos e preços |
| 🔧 `/blog` | **🔧 Média** | Blog / conteúdo institucional |
| 🔧 `/contact` | **🔧 Média** | Fale conosco / contato comercial |
| 🔧 `/reset-password` | **🔧 Alta** | Recuperação de senha |
| 🔧 `/confirm-email` | **🔧 Alta** | Confirmação de e-mail após registro |

---

## 👤 Candidato — Jornada completa

| Rota | Status | Descrição |
|------|--------|-----------|
| 🔧 `/candidate/login` | **🔧 Alta** | Login específico candidato (ou redireciona pra `/login`) |
| 🔧 `/candidate/register` | **🔧 Alta** | Cadastro específico candidato |
| `/candidate/[id]/onboarding` | ✅ | Onboarding pós-cadastro — perfil inicial |
| `/candidate/[id]/dashboard` | ✅ | Dashboard do candidato — visão geral |
| `/candidate/[id]/profile` | ✅ | Perfil completo do candidato + editar |
| `/candidate/[id]/report` | ✅ | Relatório OCEAN completo — gráfico orbital + subcritérios |
| 🔧 `/candidate/[id]/jobs` | **🔧 Alta** | Vagas recomendadas para o candidato (match) |
| 🔧 `/candidate/[id]/jobs/[jobId]` | **🔧 Alta** | Detalhe da vaga + botão candidatar |
| 🔧 `/candidate/[id]/applications` | **🔧 Média** | Histórico de candidaturas |
| 🔧 `/candidate/[id]/settings` | **🔧 Média** | Configurações da conta |
| `/candidate/orbita` | ✅ | Visualização demo/educacional do gráfico orbital |
| 🔧 `/candidate/[id]/interview` | **🔧 Média** | Página da entrevista OCEAN embutida no site (futuro, hoje via Telegram) |

---

## 🏢 Empresa — Jornada completa

| Rota | Status | Descrição |
|------|--------|-----------|
| 🔧 `/company/login` | **🔧 Alta** | Login específico empresa |
| 🔧 `/company/register` | **🔧 Alta** | Cadastro empresa |
| `/company/onboarding` | ✅ | Onboarding — configurar perfil + cultura |
| `/company/[id]/dashboard` | ✅ | Dashboard da empresa — KPIs, matches recentes |
| `/company/[id]/profile` | ✅ | Perfil da empresa + editar |
| 🔧 `/company/[id]/jobs/new` | **🔧 Alta** | Criar nova vaga |
| `/company/[id]/jobs` | ✅ | Listar vagas da empresa |
| 🔧 `/company/[id]/jobs/[jobId]` | **🔧 Alta** | Detalhe da vaga + editar |
| 🔧 `/company/[id]/jobs/[jobId]/candidates` | **🔧 Alta** | Candidatos dessa vaga + scores OCEAN |
| 🔧 `/company/[id]/candidates` | **🔧 Média** | Pool de candidatos da empresa |
| 🔧 `/company/[id]/candidates/[candidateId]` | **🔧 Média** | Perfil do candidato para a empresa |
| 🔧 `/company/[id]/matches` | **🔧 Alta** | Matches gerados + filtrar por vaga |
| 🔧 `/company/[id]/settings` | **🔧 Média** | Configurações + membros da equipe |
| `/company/orbita` | ✅ | Demo/educacional do gráfico orbital (visão empresa) |
| 🔧 `/company/[id]/billing` | **🔧 Baixa** | Faturamento / assinatura |

---

## 📋 Vagas (Público)

| Rota | Status | Descrição |
|------|--------|-----------|
| 🔧 `/jobs` | **🔧 Alta** | Lista pública de vagas (qualquer visitante vê) |
| 🔧 `/jobs/[jobId]` | **🔧 Alta** | Página pública da vaga — descrição + "Candidate-se" |

---

## 🧪 Entrevistas & Questionário

| Rota | Status | Descrição |
|------|--------|-----------|
| `/interview/[id]` | ✅ | Página de entrevista OCEAN (futura versão web) |
| `/questionnaire/[id]` | ✅ | Questionário diretamente no navegador |
| 🔧 `/interview/[id]/complete` | **🔧 Média** | Página de conclusão da entrevista + próximos passos |

---

## ⚙️ Sistema & Utilidades

| Rota | Status | Descrição |
|------|--------|-----------|
| `/notifications` | ✅ | Central de notificações |
| 🔧 `/admin` | **🔧 Baixa** | Portal admin (root) |
| 🔧 `/admin/candidates` | **🔧 Baixa** | Lista todos os candidatos |
| 🔧 `/admin/companies` | **🔧 Baixa** | Lista todas as empresas |
| 🔧 `/admin/interviews` | **🔧 Baixa** | Logs de entrevistas |
| 🔧 `/api-docs` | **🔧 Baixa** | Documentação interativa da API (Swagger/ReDoc) |
| 🔧 `/status` | **🔧 Baixa** | Página de status / health público |

---

## 🧠 Resumo de prioridades

### 🔥 Alta (fazer agora)
1. `/pricing` — Planos e preços
2. `/reset-password` — Recuperação de senha
3. `/confirm-email` — Confirmação de email
4. `/company/[id]/jobs/new` — Criar vaga
5. `/company/[id]/jobs/[jobId]/candidates` — Candidatos por vaga
6. `/company/[id]/matches` — Matches gerados
7. `/jobs` + `/jobs/[jobId]` — Vagas públicas
8. `/candidate/[id]/jobs` + `/candidate/[id]/jobs/[jobId]` — Match pro candidato
9. Rotas de login/register separadas por perfil (candidate/company)

### 📋 Média (próximo ciclo)
10. `/candidate/[id]/applications` — Histórico de candidaturas
11. `/candidate/[id]/settings` — Configurações
12. `/company/[id]/candidates` — Pool geral
13. `/company/[id]/settings` — Configurações empresa
14. `/blog` — Blog institucional
15. `/contact` — Contato

### 💤 Baixa (depois)
16. Painel admin
17. `/billing` — Assinatura
18. `/status` — Status público
19. `/api-docs` — Docs da API

---

> 📅 Gerado em: 05/05/2026
> 🔗 Base: `whymeapp.io`
> 🖥️ App: Next.js em `/root/whyme/whymeapp/apps/web/`
