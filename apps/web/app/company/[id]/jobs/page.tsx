"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  getCurrentUser,
  getCompany,
  getCompanyJobs,
  createJob,
  updateJob,
  updateJobStatus,
  getCompanyReferenceData,
  getJobMatchDetails,
  updateMatchStatus,
} from "@/lib/api"
import type { JobData, CompanyData, UserData, JobCreateRequest, JobUpdateRequest, CompanyReferenceData, CandidateMatchData } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

// ─── static data ─────────────────────────────────────────────────────────────

const STATIC_PROFESSIONS: { area: string; items: string[] }[] = [
  {
    area: "Saúde",
    items: [
      "Médico", "Enfermeiro(a)", "Fisioterapeuta", "Farmacêutico(a)", "Nutricionista",
      "Psicólogo(a)", "Fonoaudiólogo(a)", "Terapeuta Ocupacional", "Cirurgião-Dentista",
      "Biólogo(a)", "Biomédico(a)", "Médico Veterinário", "Educador(a) Físico(a)",
      "Radiologista", "Anestesista", "Epidemiologista", "Sanitarista",
    ],
  },
  {
    area: "Engenharia",
    items: [
      "Engenheiro(a) Civil", "Engenheiro(a) Elétrico(a)", "Engenheiro(a) Mecânico(a)",
      "Engenheiro(a) de Software", "Engenheiro(a) de Computação", "Engenheiro(a) Químico(a)",
      "Engenheiro(a) de Produção", "Engenheiro(a) Ambiental", "Engenheiro(a) Aeronáutico(a)",
      "Engenheiro(a) Metalúrgico(a)", "Engenheiro(a) Naval", "Engenheiro(a) de Alimentos",
      "Engenheiro(a) Agrônomo(a)", "Engenheiro(a) Biomédico(a)", "Engenheiro(a) Florestal",
      "Engenheiro(a) Sanitário(a)", "Engenheiro(a) de Minas", "Engenheiro(a) de Petróleo",
      "Engenheiro(a) de Telecomunicações", "Engenheiro(a) Cartógrafo(a)", "Engenheiro(a) de Dados",
    ],
  },
  {
    area: "Tecnologia",
    items: [
      "Cientista da Computação", "Analista de Sistemas", "Desenvolvedor(a) de Software",
      "Cientista de Dados", "Engenheiro(a) de Dados", "Arquiteto(a) de Software",
      "Analista de Segurança da Informação", "Administrador(a) de Redes",
      "Analista de Banco de Dados", "Especialista em Cloud Computing",
      "Analista de Business Intelligence", "UX Designer", "UI Designer",
      "Product Manager", "QA Engineer", "DevOps Engineer", "Especialista em Machine Learning",
    ],
  },
  {
    area: "Direito",
    items: [
      "Advogado(a)", "Promotor(a) de Justiça", "Defensor(a) Público(a)",
      "Delegado(a) de Polícia", "Juiz(a) de Direito", "Procurador(a)",
      "Notário(a)", "Registrador(a)", "Assessor(a) Jurídico(a)", "Compliance Officer",
    ],
  },
  {
    area: "Educação",
    items: [
      "Professor(a)", "Pedagogo(a)", "Orientador(a) Educacional",
      "Coordenador(a) Pedagógico(a)", "Psicopedagogo(a)", "Diretor(a) Escolar",
      "Especialista em Educação Especial", "Tutor(a) Educacional",
    ],
  },
  {
    area: "Negócios e Gestão",
    items: [
      "Administrador(a)", "Economista", "Contador(a)", "Auditor(a)", "Atuário(a)",
      "Analista Financeiro(a)", "Gestor(a) de Recursos Humanos", "Analista de Marketing",
      "Gerente de Projetos", "Consultor(a) Empresarial", "Analista de Logística",
      "Gestor(a) Comercial", "Analista de Inteligência de Mercado",
    ],
  },
  {
    area: "Comunicação e Artes",
    items: [
      "Jornalista", "Publicitário(a)", "Relações Públicas", "Radialista",
      "Designer Gráfico(a)", "Fotógrafo(a) Profissional", "Ator/Atriz", "Músico(a)",
      "Cineasta", "Designer de Interiores", "Designer de Moda",
    ],
  },
  {
    area: "Arquitetura e Urbanismo",
    items: [
      "Arquiteto(a) e Urbanista", "Paisagista", "Designer de Interiores Sênior",
      "Especialista em Patrimônio Histórico",
    ],
  },
  {
    area: "Ciências",
    items: [
      "Físico(a)", "Químico(a)", "Matemático(a)", "Estatístico(a)",
      "Geólogo(a)", "Oceanógrafo(a)", "Meteorologista", "Astrônomo(a)", "Geofísico(a)",
    ],
  },
  {
    area: "Ciências Sociais e Humanas",
    items: [
      "Sociólogo(a)", "Filósofo(a)", "Historiador(a)", "Geógrafo(a)",
      "Antropólogo(a)", "Arqueólogo(a)", "Assistente Social", "Politólogo(a)",
    ],
  },
  {
    area: "Letras e Linguística",
    items: [
      "Tradutor(a) e Intérprete", "Linguista", "Professor(a) de Línguas",
      "Revisor(a) de Textos", "Lexicógrafo(a)",
    ],
  },
  {
    area: "Agrário",
    items: [
      "Zootecnista", "Tecnólogo(a) em Agronegócio", "Agrimensor(a)",
      "Especialista em Irrigação", "Gestor(a) Ambiental Rural",
    ],
  },
  {
    area: "Tecnólogos",
    items: [
      "Tecnólogo(a) em ADS", "Tecnólogo(a) em Gestão Empresarial",
      "Tecnólogo(a) em Logística", "Tecnólogo(a) em RH",
      "Tecnólogo(a) em Marketing", "Tecnólogo(a) em Contabilidade",
      "Tecnólogo(a) em Redes de Computadores",
    ],
  },
]

const ALL_PROFESSION_NAMES: string[] = STATIC_PROFESSIONS.flatMap((g) => g.items)

const STATIC_LANGUAGES: string[] = [
  "Inglês", "Espanhol", "Português", "Francês", "Alemão", "Italiano",
  "Japonês", "Chinês (Mandarim)", "Chinês (Cantonês)", "Árabe", "Russo",
  "Hindi", "Bengali", "Punjabi", "Urdu", "Coreano", "Turco", "Hebraico",
  "Holandês", "Sueco", "Norueguês", "Dinamarquês", "Finlandês",
  "Polonês", "Tcheco", "Eslovaco", "Húngaro", "Romeno", "Grego",
  "Búlgaro", "Sérvio", "Croata", "Ucraniano", "Bielorrusso",
  "Catalão", "Galego", "Português Europeu", "Tailandês", "Vietnamita",
  "Indonésio", "Malaio", "Filipino (Tagalog)", "Persa (Farsi)", "Swahili",
  "Amárico", "Hauçá", "Iorubá", "Zulu", "Africâner",
  "Estoniano", "Letão", "Lituano", "Albanês", "Macedônio",
  "Esloveno", "Bósnio", "Azerbaijano", "Cazaque", "Uzbeque",
  "Georgiano", "Armênio", "Mongol", "Nepali", "Cingalês",
  "Birmanês", "Khmer", "Laosiano", "Tamil", "Telugu", "Kannada",
  "Marathi", "Gujarati",
]

const STATIC_HARD_SKILLS: { id: string; name: string; category: string }[] = [
  // Programação
  { id: "hs_javascript", name: "JavaScript", category: "Programação" },
  { id: "hs_typescript", name: "TypeScript", category: "Programação" },
  { id: "hs_python", name: "Python", category: "Programação" },
  { id: "hs_java", name: "Java", category: "Programação" },
  { id: "hs_csharp", name: "C#", category: "Programação" },
  { id: "hs_cplusplus", name: "C++", category: "Programação" },
  { id: "hs_go", name: "Go", category: "Programação" },
  { id: "hs_rust", name: "Rust", category: "Programação" },
  { id: "hs_php", name: "PHP", category: "Programação" },
  { id: "hs_ruby", name: "Ruby", category: "Programação" },
  { id: "hs_swift", name: "Swift", category: "Programação" },
  { id: "hs_kotlin", name: "Kotlin", category: "Programação" },
  { id: "hs_scala", name: "Scala", category: "Programação" },
  { id: "hs_r", name: "R", category: "Programação" },
  { id: "hs_dart", name: "Dart", category: "Programação" },
  // Frameworks & Libs
  { id: "hs_react", name: "React", category: "Frameworks & Libs" },
  { id: "hs_angular", name: "Angular", category: "Frameworks & Libs" },
  { id: "hs_vuejs", name: "Vue.js", category: "Frameworks & Libs" },
  { id: "hs_nextjs", name: "Next.js", category: "Frameworks & Libs" },
  { id: "hs_nodejs", name: "Node.js", category: "Frameworks & Libs" },
  { id: "hs_django", name: "Django", category: "Frameworks & Libs" },
  { id: "hs_flask", name: "Flask", category: "Frameworks & Libs" },
  { id: "hs_fastapi", name: "FastAPI", category: "Frameworks & Libs" },
  { id: "hs_spring", name: "Spring Boot", category: "Frameworks & Libs" },
  { id: "hs_laravel", name: "Laravel", category: "Frameworks & Libs" },
  { id: "hs_flutter", name: "Flutter", category: "Frameworks & Libs" },
  { id: "hs_reactnative", name: "React Native", category: "Frameworks & Libs" },
  // Dados & IA
  { id: "hs_sql", name: "SQL", category: "Dados & IA" },
  { id: "hs_postgresql", name: "PostgreSQL", category: "Dados & IA" },
  { id: "hs_mysql", name: "MySQL", category: "Dados & IA" },
  { id: "hs_mongodb", name: "MongoDB", category: "Dados & IA" },
  { id: "hs_redis", name: "Redis", category: "Dados & IA" },
  { id: "hs_ml", name: "Machine Learning", category: "Dados & IA" },
  { id: "hs_dl", name: "Deep Learning", category: "Dados & IA" },
  { id: "hs_tensorflow", name: "TensorFlow", category: "Dados & IA" },
  { id: "hs_pytorch", name: "PyTorch", category: "Dados & IA" },
  { id: "hs_spark", name: "Apache Spark", category: "Dados & IA" },
  { id: "hs_tableau", name: "Tableau", category: "Dados & IA" },
  { id: "hs_powerbi", name: "Power BI", category: "Dados & IA" },
  { id: "hs_pandas", name: "Pandas / NumPy", category: "Dados & IA" },
  // Infra & DevOps
  { id: "hs_aws", name: "AWS", category: "Infra & DevOps" },
  { id: "hs_azure", name: "Azure", category: "Infra & DevOps" },
  { id: "hs_gcp", name: "GCP", category: "Infra & DevOps" },
  { id: "hs_docker", name: "Docker", category: "Infra & DevOps" },
  { id: "hs_kubernetes", name: "Kubernetes", category: "Infra & DevOps" },
  { id: "hs_terraform", name: "Terraform", category: "Infra & DevOps" },
  { id: "hs_cicd", name: "CI/CD", category: "Infra & DevOps" },
  { id: "hs_git", name: "Git", category: "Infra & DevOps" },
  { id: "hs_linux", name: "Linux", category: "Infra & DevOps" },
  { id: "hs_nginx", name: "Nginx", category: "Infra & DevOps" },
  // Gestão & Negócios
  { id: "hs_scrum", name: "Scrum / Agile", category: "Gestão & Negócios" },
  { id: "hs_kanban", name: "Kanban", category: "Gestão & Negócios" },
  { id: "hs_pmp", name: "PMP / PMBOK", category: "Gestão & Negócios" },
  { id: "hs_lean", name: "Lean", category: "Gestão & Negócios" },
  { id: "hs_sixsigma", name: "Six Sigma", category: "Gestão & Negócios" },
  { id: "hs_okr", name: "OKR", category: "Gestão & Negócios" },
  { id: "hs_excel", name: "Excel Avançado", category: "Gestão & Negócios" },
  { id: "hs_sap", name: "SAP", category: "Gestão & Negócios" },
  { id: "hs_jira", name: "JIRA", category: "Gestão & Negócios" },
  { id: "hs_salesforce", name: "Salesforce", category: "Gestão & Negócios" },
  // Finanças & Contabilidade
  { id: "hs_fin_analysis", name: "Análise Financeira", category: "Finanças" },
  { id: "hs_fin_model", name: "Modelagem Financeira", category: "Finanças" },
  { id: "hs_valuation", name: "Valuation", category: "Finanças" },
  { id: "hs_accounting", name: "Contabilidade", category: "Finanças" },
  { id: "hs_audit", name: "Auditoria", category: "Finanças" },
  { id: "hs_budget", name: "Planejamento Orçamentário", category: "Finanças" },
  { id: "hs_ifrs", name: "IFRS / CPC", category: "Finanças" },
  { id: "hs_tax", name: "Tributação", category: "Finanças" },
  // Marketing & Vendas
  { id: "hs_seo", name: "SEO", category: "Marketing & Vendas" },
  { id: "hs_sem", name: "SEM / Google Ads", category: "Marketing & Vendas" },
  { id: "hs_meta_ads", name: "Meta Ads", category: "Marketing & Vendas" },
  { id: "hs_email_mkt", name: "Email Marketing", category: "Marketing & Vendas" },
  { id: "hs_ga", name: "Google Analytics", category: "Marketing & Vendas" },
  { id: "hs_social_media", name: "Social Media Marketing", category: "Marketing & Vendas" },
  { id: "hs_inbound", name: "Inbound Marketing", category: "Marketing & Vendas" },
  { id: "hs_content", name: "Content Marketing", category: "Marketing & Vendas" },
  { id: "hs_hubspot", name: "HubSpot", category: "Marketing & Vendas" },
  { id: "hs_crm", name: "CRM", category: "Marketing & Vendas" },
  // Design
  { id: "hs_figma", name: "Figma", category: "Design" },
  { id: "hs_photoshop", name: "Adobe Photoshop", category: "Design" },
  { id: "hs_illustrator", name: "Adobe Illustrator", category: "Design" },
  { id: "hs_indesign", name: "Adobe InDesign", category: "Design" },
  { id: "hs_autocad", name: "AutoCAD", category: "Design" },
  { id: "hs_revit", name: "Revit", category: "Design" },
  { id: "hs_blender", name: "Blender / 3D", category: "Design" },
  { id: "hs_ux", name: "UX Research", category: "Design" },
  { id: "hs_design_thinking", name: "Design Thinking", category: "Design" },
  // RH & Pessoas
  { id: "hs_recrutamento", name: "Recrutamento e Seleção", category: "RH & Pessoas" },
  { id: "hs_assessment", name: "Assessment", category: "RH & Pessoas" },
  { id: "hs_td", name: "Treinamento e Desenvolvimento", category: "RH & Pessoas" },
  { id: "hs_avaliacao", name: "Avaliação de Desempenho", category: "RH & Pessoas" },
  { id: "hs_remuneracao", name: "Remuneração e Benefícios", category: "RH & Pessoas" },
  { id: "hs_hrbp", name: "HRBP", category: "RH & Pessoas" },
  // Jurídico
  { id: "hs_dir_civil", name: "Direito Civil", category: "Jurídico" },
  { id: "hs_dir_trab", name: "Direito Trabalhista", category: "Jurídico" },
  { id: "hs_dir_trib", name: "Direito Tributário", category: "Jurídico" },
  { id: "hs_compliance", name: "Compliance", category: "Jurídico" },
  { id: "hs_lgpd", name: "LGPD", category: "Jurídico" },
  { id: "hs_contratos", name: "Contratos", category: "Jurídico" },
  { id: "hs_propriedade", name: "Propriedade Intelectual", category: "Jurídico" },
  // Saúde
  { id: "hs_bls", name: "BLS / ACLS", category: "Saúde" },
  { id: "hs_farmacologia", name: "Farmacologia", category: "Saúde" },
  { id: "hs_epidemiologia", name: "Epidemiologia", category: "Saúde" },
  { id: "hs_bioinformatica", name: "Bioinformática", category: "Saúde" },
  { id: "hs_anvisa", name: "Regulatório ANVISA", category: "Saúde" },
]

// ─── types ────────────────────────────────────────────────────────────────────

type OceanKey = "o" | "c" | "e" | "a" | "n"
type OceanSliders = Record<OceanKey, number>
type LangEntry = { language: string; level: string }

const OCEAN_KEYS: OceanKey[] = ["o", "c", "e", "a", "n"]
const OCEAN_LABELS: Record<OceanKey, string> = {
  o: "Abertura",
  c: "Conscienciosidade",
  e: "Extroversão",
  a: "Amabilidade",
  n: "Neuroticismo",
}

const DEFAULT_SLIDERS: OceanSliders = { o: 50, c: 50, e: 50, a: 50, n: 50 }

// Score colors per STYLE_GUIDE
function scoreColor(pct: number): string {
  if (pct >= 85) return "#38d391"
  if (pct >= 70) return "#3AB0FF"
  if (pct >= 55) return "#f5b454"
  return "#f06b6b"
}

// ─── radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ ocean }: { ocean: Record<string, number> | null }) {
  const cx = 40, cy = 40, r = 22, labelR = 32
  const angles = OCEAN_KEYS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5)
  const gridPoints = (scale: number) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(" ")
  const values = OCEAN_KEYS.map((k) => ocean?.[k] ?? 0)
  const dataPoints = angles
    .map((a, i) => `${cx + r * values[i] * Math.cos(a)},${cy + r * values[i] * Math.sin(a)}`)
    .join(" ")

  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={gridPoints(s)} fill="none" stroke="rgba(58,176,255,0.15)" strokeWidth="0.5" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(58,176,255,0.15)" strokeWidth="0.5" />
      ))}
      {ocean && (
        <polygon points={dataPoints} fill="rgba(58,176,255,0.18)" stroke="#3AB0FF" strokeWidth="1.5" strokeLinejoin="round" />
      )}
      {angles.map((a, i) => (
        <text key={OCEAN_KEYS[i]} x={cx + labelR * Math.cos(a)} y={cy + labelR * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="rgba(148,163,184,0.8)" fontWeight="600">
          {OCEAN_KEYS[i].toUpperCase()}
        </text>
      ))}
    </svg>
  )
}

// ─── field helpers ────────────────────────────────────────────────────────────

const INPUT_STYLE = {
  background: "rgba(8,22,46,0.72)",
  border: "1px solid rgba(58,176,255,0.15)",
}

function FieldInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  min?: number
  max?: number
}) {
  return (
    <input
      type={type}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
      style={INPUT_STYLE}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
    />
  )
}

function FieldSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors"
      style={INPUT_STYLE}
    >
      {children}
    </select>
  )
}

// ─── job form modal ───────────────────────────────────────────────────────────

function JobFormModal({
  companyId,
  editing,
  token,
  onClose,
  onSaved,
}: {
  companyId: string
  editing: JobData | null
  token: string
  onClose: () => void
  onSaved: (job: JobData) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [profession, setProfession] = useState(editing?.profession ?? "")
  const [sliders, setSliders] = useState<OceanSliders>(() => {
    if (editing?.ocean_ideal) {
      const o = editing.ocean_ideal as Record<string, number>
      return {
        o: Math.round((o.o ?? 0.5) * 100),
        c: Math.round((o.c ?? 0.5) * 100),
        e: Math.round((o.e ?? 0.5) * 100),
        a: Math.round((o.a ?? 0.5) * 100),
        n: Math.round((o.n ?? 0.5) * 100),
      }
    }
    return DEFAULT_SLIDERS
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [refData, setRefData] = useState<CompanyReferenceData | null>(null)
  const [refDataLoading, setRefDataLoading] = useState(false)
  const [refDataLoaded, setRefDataLoaded] = useState(false)

  // Hard skills state
  const [hardSkillsRequired, setHardSkillsRequired] = useState<string[]>(
    editing?.hard_skills_required ?? [],
  )
  const [hardSkillSearch, setHardSkillSearch] = useState("")
  const [activeSkillCategory, setActiveSkillCategory] = useState("Todos")

  // Other fields
  const [educationLevelMin, setEducationLevelMin] = useState(editing?.education_level_min ?? "")
  const [experienceYearsMin, setExperienceYearsMin] = useState<number | "">(
    editing?.experience_years_min ?? "",
  )
  const [workModel, setWorkModel] = useState(editing?.work_model ?? "")
  const [salaryMin, setSalaryMin] = useState<number | "">(editing?.salary_min ?? "")
  const [salaryMax, setSalaryMax] = useState<number | "">(editing?.salary_max ?? "")
  const [location, setLocation] = useState(editing?.location ?? "")

  // Languages state
  const [languagesRequired, setLanguagesRequired] = useState<LangEntry[]>(
    editing?.languages_required ?? [],
  )
  const [langPickLanguage, setLangPickLanguage] = useState("")
  const [langPickLevel, setLangPickLevel] = useState("")
  const [langSearch, setLangSearch] = useState("")

  const ocean_ideal = Object.fromEntries(
    OCEAN_KEYS.map((k) => [k, sliders[k] / 100]),
  ) as Record<string, number>

  // Merge static skills with API skills (API supplements static)
  const allHardSkills = [
    ...STATIC_HARD_SKILLS,
    ...(refData?.hard_skills ?? []).filter(
      (apiSkill) => !STATIC_HARD_SKILLS.some((s) => s.id === apiSkill.id),
    ),
  ]

  const skillCategories = ["Todos", ...Array.from(new Set(allHardSkills.map((s) => s.category)))]

  const filteredSkills = allHardSkills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(hardSkillSearch.toLowerCase())
    const matchCat = activeSkillCategory === "Todos" || s.category === activeSkillCategory
    return matchSearch && matchCat
  })

  const languageLevels = refData?.language_levels?.length
    ? refData.language_levels
    : ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"]

  const filteredLanguages = STATIC_LANGUAGES.filter(
    (l) =>
      l.toLowerCase().includes(langSearch.toLowerCase()) &&
      !languagesRequired.some((lr) => lr.language === l),
  )

  useEffect(() => {
    if (!refDataLoaded && !refDataLoading) {
      setRefDataLoading(true)
      getCompanyReferenceData(token || undefined)
        .then((data) => { setRefData(data); setRefDataLoaded(true) })
        .catch(() => { setRefDataLoaded(true) })
        .finally(() => setRefDataLoading(false))
    }
  }, [refDataLoaded, refDataLoading, token])

  function toggleHardSkill(id: string) {
    setHardSkillsRequired((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 10 ? [...prev, id] : prev,
    )
  }

  function addLanguage() {
    if (!langPickLanguage || !langPickLevel) return
    setLanguagesRequired((prev) => [...prev, { language: langPickLanguage, level: langPickLevel }])
    setLangPickLanguage("")
    setLangPickLevel("")
    setLangSearch("")
  }

  function removeLanguage(idx: number) {
    setLanguagesRequired((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setFormError("Título é obrigatório"); return }
    setSubmitting(true)
    setFormError("")
    try {
      let saved: JobData
      const sharedFields = {
        title: title.trim(),
        description: description.trim() || null,
        ocean_ideal,
        hard_skills_required: hardSkillsRequired.length > 0 ? hardSkillsRequired : undefined,
        education_level_min: educationLevelMin || null,
        experience_years_min: experienceYearsMin !== "" ? Number(experienceYearsMin) : null,
        work_model: workModel || null,
        salary_min: salaryMin !== "" ? Number(salaryMin) : null,
        salary_max: salaryMax !== "" ? Number(salaryMax) : null,
        location: location.trim() || null,
        profession: profession.trim() || null,
        languages_required: languagesRequired.length > 0 ? languagesRequired : undefined,
      }
      if (editing) {
        saved = await updateJob(editing.id, sharedFields as JobUpdateRequest, token)
      } else {
        saved = await createJob({ company_id: companyId, ...sharedFields } as JobCreateRequest, token)
      }
      onSaved(saved)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar vaga")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: "rgba(4,12,24,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-t-[24px] sm:rounded-[18px] shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: "rgba(16,34,68,0.95)", border: "1px solid rgba(58,176,255,0.15)" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(58,176,255,0.10)" }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.7)" }}>
              {editing ? "Editar" : "Nova"}
            </p>
            <h2 className="text-[17px] font-bold text-foreground">
              {editing ? "Editar Vaga" : "Nova Vaga"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            style={{ background: "rgba(58,176,255,0.05)" }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-5 px-6 py-5">

          {/* Profession */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Profissão / Área de Formação
            </label>
            <input
              type="text"
              list="professions-list"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Selecione ou digite a profissão…"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
              style={INPUT_STYLE}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
            />
            <datalist id="professions-list">
              {STATIC_PROFESSIONS.map((group) =>
                group.items.map((p) => <option key={p} value={p} />),
              )}
            </datalist>
            {profession && !ALL_PROFESSION_NAMES.includes(profession) && (
              <p className="text-[11px] text-muted-foreground/60">Profissão personalizada</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Título da Vaga</label>
            <FieldInput value={title} onChange={setTitle} placeholder="ex: Desenvolvedor Full Stack Sênior" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a vaga, responsabilidades, benefícios..."
              rows={3}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
              style={INPUT_STYLE}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
            />
          </div>

          {/* OCEAN Sliders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Perfil OCEAN Ideal
              </label>
              <div className="flex h-10 w-10 items-center justify-center">
                <RadarChart ocean={ocean_ideal} />
              </div>
            </div>
            <div
              className="space-y-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(8,22,46,0.5)", border: "1px solid rgba(58,176,255,0.10)" }}
            >
              {OCEAN_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-[11px] font-black" style={{ color: "rgba(58,176,255,0.9)" }}>
                    {key.toUpperCase()}
                  </span>
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{OCEAN_LABELS[key]}</span>
                  <input
                    type="range" min={0} max={100} value={sliders[key]}
                    onChange={(e) => setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
                    style={{ accentColor: "#3AB0FF", background: "rgba(255,255,255,0.08)" }}
                  />
                  <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums" style={{ color: "#3AB0FF" }}>
                    {sliders[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hard Skills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Hard Skills Requeridas
              </label>
              <span className="text-[11px] text-muted-foreground/60">
                {hardSkillsRequired.length}/10 selecionadas
              </span>
            </div>

            {/* Selected chips */}
            {hardSkillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hardSkillsRequired.map((id) => {
                  const skill = allHardSkills.find((s) => s.id === id)
                  return skill ? (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                      style={{ background: "rgba(58,176,255,0.12)", border: "1px solid rgba(58,176,255,0.30)", color: "#BFE0FF" }}
                    >
                      {skill.name}
                      <button type="button" onClick={() => toggleHardSkill(id)} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                    </span>
                  ) : null
                })}
              </div>
            )}

            {/* Search */}
            <FieldInput value={hardSkillSearch} onChange={setHardSkillSearch} placeholder="Buscar habilidades…" />

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {skillCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveSkillCategory(cat)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
                  style={
                    activeSkillCategory === cat
                      ? { background: "rgba(58,176,255,0.18)", border: "1px solid rgba(58,176,255,0.40)", color: "#BFE0FF" }
                      : { background: "rgba(8,22,46,0.5)", border: "1px solid rgba(58,176,255,0.10)", color: "rgba(200,213,234,0.6)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skill list */}
            <div
              className="max-h-36 overflow-y-auto rounded-xl"
              style={{ background: "rgba(8,22,46,0.5)", border: "1px solid rgba(58,176,255,0.10)" }}
            >
              {filteredSkills.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground/50">Nenhuma habilidade encontrada.</p>
              ) : (
                filteredSkills.map((skill) => {
                  const active = hardSkillsRequired.includes(skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleHardSkill(skill.id)}
                      disabled={!active && hardSkillsRequired.length >= 10}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors disabled:opacity-40"
                      style={active ? { background: "rgba(58,176,255,0.10)", color: "#BFE0FF" } : { color: "rgba(200,213,234,0.7)" }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(58,176,255,0.05)" }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "" }}
                    >
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground/40">{skill.category}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Languages Required */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Idiomas Requeridos
            </label>

            {/* Selected languages */}
            {languagesRequired.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {languagesRequired.map((lr, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)", color: "#DDD0FF" }}
                  >
                    {lr.language} · {lr.level}
                    <button type="button" onClick={() => removeLanguage(idx)} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Add language row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  list="languages-list"
                  value={langSearch || langPickLanguage}
                  onChange={(e) => {
                    setLangSearch(e.target.value)
                    setLangPickLanguage(e.target.value)
                  }}
                  placeholder="Selecione o idioma…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
                  style={INPUT_STYLE}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                />
                <datalist id="languages-list">
                  {filteredLanguages.map((l) => <option key={l} value={l} />)}
                </datalist>
              </div>
              <select
                value={langPickLevel}
                onChange={(e) => setLangPickLevel(e.target.value)}
                className="w-36 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                style={INPUT_STYLE}
              >
                <option value="">Nível</option>
                {languageLevels.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </select>
              <button
                type="button"
                onClick={addLanguage}
                disabled={!langPickLanguage || !langPickLevel}
                className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.30)", color: "#DDD0FF" }}
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Education level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Formação Mín.</label>
              <FieldSelect value={educationLevelMin} onChange={setEducationLevelMin}>
                <option value="">Qualquer</option>
                {refData?.education_levels.map((el) => {
                  const id = typeof el === "string" ? el : el.id
                  const name = typeof el === "string" ? el : el.name
                  return <option key={id} value={id}>{name}</option>
                })}
              </FieldSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Anos Exp. Mín.</label>
              <FieldInput
                type="number"
                min={0}
                max={50}
                value={experienceYearsMin}
                onChange={(v) => setExperienceYearsMin(v ? Number(v) : "")}
                placeholder="0"
              />
            </div>
          </div>

          {/* Work model */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Modelo de Trabalho</label>
            <FieldSelect value={workModel} onChange={setWorkModel}>
              <option value="">Selecione</option>
              {["presencial", "hibrido", "remoto"].map((wm) => (
                <option key={wm} value={wm}>{wm.charAt(0).toUpperCase() + wm.slice(1)}</option>
              ))}
            </FieldSelect>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Salário Mín.</label>
              <FieldInput type="number" min={0} value={salaryMin} onChange={(v) => setSalaryMin(v ? Number(v) : "")} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Salário Máx.</label>
              <FieldInput type="number" min={0} value={salaryMax} onChange={(v) => setSalaryMax(v ? Number(v) : "")} placeholder="0" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Localização</label>
            <FieldInput value={location} onChange={setLocation} placeholder="ex: São Paulo, SP" />
          </div>

          {formError && (
            <p className="rounded-xl px-3 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.10)", color: "#f87171" }}>
              {formError}
            </p>
          )}

          <div className="flex gap-3 pb-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={submitting} className="flex-1">
              {editing ? "Salvar Alterações" : "Criar Vaga"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── status config ────────────────────────────────────────────────────────────

const MATCH_STATUS: Record<string, { label: string; dot: string; style: React.CSSProperties }> = {
  pending:   { label: "Pendente",  dot: "rgba(200,213,234,0.5)", style: { background: "rgba(200,213,234,0.06)", border: "1px solid rgba(200,213,234,0.20)", color: "rgba(200,213,234,0.7)" } },
  accepted:  { label: "Aceito",   dot: "#38d391", style: { background: "rgba(56,211,145,0.08)", border: "1px solid rgba(56,211,145,0.35)", color: "#b6e8d2" } },
  rejected:  { label: "Recusado", dot: "#f06b6b", style: { background: "rgba(240,107,107,0.06)", border: "1px solid rgba(240,107,107,0.30)", color: "#f0bdbd" } },
  bilateral: { label: "Bilateral", dot: "#8B5CF6", style: { background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.35)", color: "#DDD0FF" } },
}

function StatusPill({ status }: { status: string }) {
  const cfg = MATCH_STATUS[status] ?? MATCH_STATUS.pending
  return (
    <span className="flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold" style={cfg.style}>
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  token,
  onEdit,
  onStatusChanged,
}: {
  job: JobData
  token: string
  onEdit: (job: JobData) => void
  onStatusChanged: (job: JobData) => void
}) {
  const [toggling, setToggling] = useState(false)
  const [showCandidates, setShowCandidates] = useState(false)
  const [candidates, setCandidates] = useState<CandidateMatchData[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [candidatesLoaded, setCandidatesLoaded] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  async function handleToggle() {
    setToggling(true)
    try {
      const nextStatus = job.status === "active" ? "draft" : "active"
      const updated = await updateJobStatus(job.id, nextStatus, token)
      onStatusChanged(updated)
    } catch { /* silently ignore */ }
    finally { setToggling(false) }
  }

  async function handleViewCandidates() {
    setShowCandidates((prev) => !prev)
    if (!candidatesLoaded) {
      setLoadingCandidates(true)
      try {
        const data = await getJobMatchDetails(job.id, token)
        setCandidates(data)
        setCandidatesLoaded(true)
      } catch { setCandidatesLoaded(true) }
      finally { setLoadingCandidates(false) }
    }
  }

  async function handleMatchAction(matchId: string, status: "accepted" | "rejected") {
    setActioning(matchId)
    try {
      await updateMatchStatus(matchId, status, token)
      setCandidates((prev) => prev.map((c) => (c.id === matchId ? { ...c, status } : c)))
    } catch { /* silently fail */ }
    finally { setActioning(null) }
  }

  const isActive = job.status === "active"
  const pendingCount = candidates.filter((c) => c.status === "pending").length

  return (
    <div
      className="flex flex-col rounded-[18px] transition-all duration-200"
      style={{
        background: "rgba(16,34,68,0.78)",
        border: "1px solid rgba(58,176,255,0.12)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(58,176,255,0.22)"
        e.currentTarget.style.boxShadow = "0 16px 40px -16px rgba(58,176,255,0.30), 0 4px 24px rgba(0,0,0,0.25)"
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(58,176,255,0.12)"
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)"
        e.currentTarget.style.transform = ""
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {job.profession && (
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                {job.profession}
              </p>
            )}
            <h3 className="truncate text-[17px] font-bold text-foreground">{job.title}</h3>
            {job.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            )}
            {/* Meta pills */}
            {(job.work_model || job.location || job.experience_years_min != null) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.work_model && (
                  <span className="rounded-lg px-2 py-0.5 text-[11px] font-medium" style={{ background: "rgba(8,22,46,0.72)", border: "1px solid rgba(58,176,255,0.12)", color: "rgba(200,213,234,0.7)" }}>
                    {job.work_model.charAt(0).toUpperCase() + job.work_model.slice(1)}
                  </span>
                )}
                {job.location && (
                  <span className="rounded-lg px-2 py-0.5 text-[11px] font-medium" style={{ background: "rgba(8,22,46,0.72)", border: "1px solid rgba(58,176,255,0.12)", color: "rgba(200,213,234,0.7)" }}>
                    {job.location}
                  </span>
                )}
                {job.experience_years_min != null && job.experience_years_min > 0 && (
                  <span className="rounded-lg px-2 py-0.5 text-[11px] font-medium" style={{ background: "rgba(8,22,46,0.72)", border: "1px solid rgba(58,176,255,0.12)", color: "rgba(200,213,234,0.7)" }}>
                    {job.experience_years_min}+ anos exp.
                  </span>
                )}
              </div>
            )}
          </div>
          <span
            className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={
              isActive
                ? { background: "rgba(56,211,145,0.08)", border: "1px solid rgba(56,211,145,0.35)", color: "#b6e8d2" }
                : { background: "rgba(200,213,234,0.06)", border: "1px solid rgba(200,213,234,0.15)", color: "rgba(200,213,234,0.5)" }
            }
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: isActive ? "#38d391" : "rgba(200,213,234,0.4)" }} />
            {isActive ? "Ativa" : "Inativa"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadarChart ocean={job.ocean_ideal} />
            {!job.ocean_ideal && (
              <span className="text-xs text-muted-foreground/40">Sem perfil OCEAN</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(job)}>Editar</Button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
              style={
                isActive
                  ? { border: "1px solid rgba(240,107,107,0.40)", color: "#f06b6b" }
                  : { border: "1px solid rgba(56,211,145,0.40)", color: "#38d391" }
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isActive ? "rgba(240,107,107,0.08)" : "rgba(56,211,145,0.08)"
              }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "" }}
            >
              {toggling ? "…" : isActive ? "Desativar" : "Ativar"}
            </button>
          </div>
        </div>

        {/* View candidates toggle */}
        <button
          onClick={handleViewCandidates}
          className="mt-4 flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all"
          style={{ border: "1px solid rgba(58,176,255,0.10)", background: "rgba(8,22,46,0.4)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(58,176,255,0.20)"
            e.currentTarget.style.color = "rgba(200,213,234,0.9)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(58,176,255,0.10)"
            e.currentTarget.style.color = ""
          }}
        >
          <span>
            {showCandidates ? "Ocultar candidatos" : "Ver candidatos"}
            {candidatesLoaded && candidates.length > 0 && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: "rgba(58,176,255,0.15)", color: "#3AB0FF" }}
              >
                {candidates.length}
                {pendingCount > 0 && ` · ${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}`}
              </span>
            )}
          </span>
          <span className="text-muted-foreground/50">{showCandidates ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Candidates panel */}
      {showCandidates && (
        <div style={{ borderTop: "1px solid rgba(58,176,255,0.08)" }}>
          {loadingCandidates ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">Carregando…</div>
          ) : candidates.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground/40">Nenhum candidato ainda</div>
          ) : (
            <div style={{ borderTop: "none" }}>
              {candidates.map((c) => {
                const pct = Math.round(c.score * 100)
                const isActioning = actioning === c.id
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-3"
                    style={{ borderTop: "1px solid rgba(58,176,255,0.06)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c.candidate_name}</p>
                      {c.candidate_headline && (
                        <p className="truncate text-xs text-muted-foreground">{c.candidate_headline}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {/* Score bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: scoreColor(pct) }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-bold tabular-nums" style={{ color: scoreColor(pct) }}>
                          {pct}%
                        </span>
                      </div>
                      <StatusPill status={c.status} />
                      {c.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMatchAction(c.id, "accepted")}
                            disabled={!!isActioning}
                            className="rounded-lg px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-40"
                            style={{ color: "#38d391" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(56,211,145,0.10)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "" }}
                          >
                            {isActioning ? "…" : "Aceitar"}
                          </button>
                          <button
                            onClick={() => handleMatchAction(c.id, "rejected")}
                            disabled={!!isActioning}
                            className="rounded-lg px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-40"
                            style={{ color: "#f06b6b" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(240,107,107,0.08)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "" }}
                          >
                            {isActioning ? "…" : "Recusar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function CompanyJobsPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobData | null>(null)

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    let cancelled = false
    async function load() {
      try {
        const [userData, companyData, jobsData] = await Promise.all([
          getCurrentUser(token),
          getCompany(companyId, token),
          getCompanyJobs(companyId, token),
        ])
        if (cancelled) return
        setUser(userData)
        setCompany(companyData)
        setJobs(jobsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, companyId])

  function openCreate() { setEditingJob(null); setModalOpen(true) }
  function openEdit(job: JobData) { setEditingJob(job); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingJob(null) }

  function handleSaved(saved: JobData) {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    closeModal()
  }

  function handleStatusChanged(updated: JobData) {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
  }

  if (loading) return <LoadingSpinner message="Carregando vagas…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Você precisa estar logado para gerenciar vagas." onRetry={() => window.location.href = "/login"} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

  const activeCount = jobs.filter((j) => j.status === "active").length

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(900px 500px at 80% -5%, rgba(58,176,255,0.08), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgba(139,92,246,0.07), transparent 65%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ borderColor: "rgba(58,176,255,0.10)", backgroundColor: "rgba(11,31,58,0.92)", backdropFilter: "blur(14px)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`/company/${companyId}/dashboard`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {company?.name ?? "Empresa"}
              </a>
              <span className="text-xs" style={{ color: "rgba(200,213,234,0.3)" }}>/</span>
              <h1 className="text-sm font-bold text-foreground">Vagas</h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="font-bold tabular-nums" style={{ color: "#3AB0FF" }}>{jobs.length}</span>
              {" "}vaga{jobs.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-bold tabular-nums" style={{ color: "#38d391" }}>{activeCount}</span>
              {" "}ativa{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-xs font-medium text-muted-foreground">{user.name}</span>}
            <Button onClick={openCreate}>+ Nova Vaga</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-7">
        {jobs.length === 0 ? (
          <EmptyState
            icon="💼"
            title="Nenhuma vaga cadastrada"
            description="Crie a primeira vaga para começar a receber candidatos."
            action={<Button onClick={openCreate}>Criar Primeira Vaga</Button>}
          />
        ) : (
          <>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.7)" }}>
              Pipeline de Vagas
            </p>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  token={token}
                  onEdit={openEdit}
                  onStatusChanged={handleStatusChanged}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <JobFormModal
          companyId={companyId}
          editing={editingJob}
          token={token}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
