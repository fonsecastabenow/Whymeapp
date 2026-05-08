"""
Seed: 20 empresas, 40 vagas, 100 candidatos — Minas Gerais (concentração em Gov. Valadares).
Run: python seed_test_data.py   (API em http://localhost:8000)
"""
import sys, math
import httpx

API_BASE = "http://localhost:8000"
PW = "Test@12345"

REVERSED_ITEMS = {3, 6, 9, 12, 14, 16, 18, 20, 22, 25, 27, 30}
_DIMS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
_W = {"openness": 1.0, "conscientiousness": 1.0, "extraversion": 0.8, "agreeableness": 0.9, "neuroticism": 1.1}


def scores_to_responses(s: dict) -> list[int]:
    out = []
    for i in range(30):
        dim = _DIMS[i // 6]
        raw = s[dim] * 4.0 + 1.0
        q = i + 1
        resp = round(6.0 - raw) if q in REVERSED_ITEMS else round(raw)
        out.append(max(1, min(5, resp)))
    return out


def ok(r: httpx.Response) -> dict:
    if r.status_code not in (200, 201):
        try: body = r.json()
        except Exception: body = r.text
        raise RuntimeError(f"HTTP {r.status_code}: {body}")
    return r.json()


def hdr(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def interview_id(link: str) -> str:
    return link.rstrip("/").split("/")[-1]


# ── Culture answer templates ──────────────────────────────────────────────────
CULT = {
    "tech":       [5, 4, 5, 3, 4, 5, 4, 4, 3, 5],
    "saude":      [4, 5, 4, 5, 5, 4, 5, 5, 4, 4],
    "industria":  [4, 4, 5, 4, 3, 5, 4, 3, 5, 4],
    "consultoria":[5, 4, 4, 3, 5, 4, 5, 3, 4, 5],
    "varejo":     [4, 5, 3, 5, 4, 4, 5, 4, 3, 5],
    "educacao":   [5, 5, 4, 5, 4, 5, 4, 5, 4, 4],
    "financas":   [4, 4, 5, 4, 5, 3, 4, 5, 4, 3],
    "marketing":  [5, 4, 5, 3, 4, 4, 5, 3, 5, 4],
}

# ── Companies ─────────────────────────────────────────────────────────────────
COMPANIES = [
  { "name":"TechValares Soluções","email":"techvalares@whymetest.com.br","industry":"Tecnologia","size":"11-50",
    "website":"https://techvalares.com.br","linkedin_url":"https://linkedin.com/company/techvalares",
    "description":"Desenvolvimento de software para o Vale do Rio Doce.","cult":"tech",
    "jobs":[
      {"title":"Desenvolvedor Full Stack Sênior","description":"Desenvolvimento web/mobile em squad ágil.",
       "ocean":{"o":0.80,"c":0.82,"e":0.60,"a":0.72,"n":0.18},"skills":["Python","React","TypeScript"],
       "exp":5,"model":"hibrido","smin":8000,"smax":14000,"loc":"Governador Valadares, MG"},
      {"title":"Analista de QA","description":"Testes automatizados e manuais de produtos digitais.",
       "ocean":{"o":0.45,"c":0.92,"e":0.28,"a":0.72,"n":0.12},"skills":["Python","SQL"],
       "exp":2,"model":"remoto","smin":5000,"smax":8000,"loc":"Remoto (MG)"},
    ]},
  { "name":"DataMinas Analytics","email":"dataminas@whymetest.com.br","industry":"Tecnologia","size":"11-50",
    "website":"https://dataminas.com.br","linkedin_url":"https://linkedin.com/company/dataminas",
    "description":"Consultoria de dados e BI para o mercado mineiro.","cult":"tech",
    "jobs":[
      {"title":"Cientista de Dados","description":"Modelos preditivos e análise exploratória.",
       "ocean":{"o":0.72,"c":0.90,"e":0.35,"a":0.62,"n":0.12},"skills":["Python","SQL"],
       "exp":3,"model":"remoto","smin":7000,"smax":12000,"loc":"Remoto (MG)"},
      {"title":"Engenheiro de Dados","description":"Pipelines ETL e arquitetura de dados em nuvem.",
       "ocean":{"o":0.55,"c":0.92,"e":0.28,"a":0.58,"n":0.10},"skills":["Python","SQL"],
       "exp":4,"model":"remoto","smin":8000,"smax":13000,"loc":"Remoto (MG)"},
    ]},
  { "name":"AppVale Desenvolvimento","email":"appvale@whymetest.com.br","industry":"Tecnologia","size":"1-10",
    "website":"https://appvale.com.br","linkedin_url":"https://linkedin.com/company/appvale",
    "description":"Startup de apps mobile em Governador Valadares.","cult":"tech",
    "jobs":[
      {"title":"Desenvolvedor Mobile (React Native)","description":"Apps iOS e Android para clientes regionais.",
       "ocean":{"o":0.78,"c":0.80,"e":0.52,"a":0.70,"n":0.20},"skills":["React","TypeScript"],
       "exp":2,"model":"remoto","smin":6000,"smax":10000,"loc":"Governador Valadares, MG"},
      {"title":"UX/UI Designer","description":"Design de interfaces e pesquisa com usuários.",
       "ocean":{"o":0.88,"c":0.70,"e":0.65,"a":0.78,"n":0.25},"skills":[],
       "exp":2,"model":"hibrido","smin":4000,"smax":7000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"SoftMinas Sistemas","email":"softminas@whymetest.com.br","industry":"Tecnologia","size":"11-50",
    "website":"https://softminas.com.br","linkedin_url":"https://linkedin.com/company/softminas",
    "description":"ERP e sistemas de gestão para indústrias do Vale do Aço.","cult":"tech",
    "jobs":[
      {"title":"Desenvolvedor Backend (Python/Java)","description":"APIs REST e integração com ERPs industriais.",
       "ocean":{"o":0.70,"c":0.85,"e":0.38,"a":0.65,"n":0.18},"skills":["Python","SQL"],
       "exp":3,"model":"hibrido","smin":7000,"smax":11000,"loc":"Ipatinga, MG"},
      {"title":"DevOps / SRE","description":"CI/CD, Kubernetes e monitoramento de infra.",
       "ocean":{"o":0.65,"c":0.88,"e":0.40,"a":0.60,"n":0.15},"skills":["Python"],
       "exp":3,"model":"remoto","smin":8000,"smax":13000,"loc":"Ipatinga, MG"},
    ]},
  { "name":"MinaSaúde Clínicas","email":"minasaude@whymetest.com.br","industry":"Saúde","size":"51-200",
    "website":"https://minasaude.com.br","linkedin_url":"https://linkedin.com/company/minasaude",
    "description":"Rede de clínicas de saúde da família no interior de MG.","cult":"saude",
    "jobs":[
      {"title":"Assistente Administrativo","description":"Agendamentos, faturamento e atendimento ao paciente.",
       "ocean":{"o":0.32,"c":0.80,"e":0.52,"a":0.90,"n":0.38},"skills":[],
       "exp":1,"model":"presencial","smin":2500,"smax":3500,"loc":"Governador Valadares, MG"},
      {"title":"Coordenador de RH","description":"Gestão de RH para 150+ colaboradores em 4 unidades.",
       "ocean":{"o":0.58,"c":0.78,"e":0.82,"a":0.88,"n":0.22},"skills":[],
       "exp":4,"model":"hibrido","smin":5000,"smax":8000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"ValeVida Hospital","email":"valevida@whymetest.com.br","industry":"Saúde","size":"201-500",
    "website":"https://valevida.com.br","linkedin_url":"https://linkedin.com/company/valevida",
    "description":"Hospital geral referência no Leste de Minas Gerais.","cult":"saude",
    "jobs":[
      {"title":"Recepcionista Hospitalar","description":"Atendimento e triagem de pacientes nas urgências.",
       "ocean":{"o":0.38,"c":0.75,"e":0.72,"a":0.92,"n":0.40},"skills":[],
       "exp":1,"model":"presencial","smin":2000,"smax":3000,"loc":"Governador Valadares, MG"},
      {"title":"Analista de Faturamento Médico","description":"Contas médicas, TISS e auditoria de procedimentos.",
       "ocean":{"o":0.35,"c":0.90,"e":0.30,"a":0.70,"n":0.20},"skills":["SQL"],
       "exp":2,"model":"presencial","smin":3000,"smax":4500,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"MedCenter Diagnósticos","email":"medcenter@whymetest.com.br","industry":"Saúde","size":"51-200",
    "website":"https://medcenter.com.br","linkedin_url":"https://linkedin.com/company/medcenter",
    "description":"Clínica de diagnóstico por imagem no Vale do Aço.","cult":"saude",
    "jobs":[
      {"title":"Técnico de Radiologia","description":"Exames de RX, TC e RM com foco em qualidade e segurança.",
       "ocean":{"o":0.42,"c":0.85,"e":0.38,"a":0.80,"n":0.18},"skills":[],
       "exp":2,"model":"presencial","smin":3000,"smax":4500,"loc":"Coronel Fabriciano, MG"},
      {"title":"Coordenador Clínico","description":"Gestão operacional da clínica e equipe técnica.",
       "ocean":{"o":0.55,"c":0.80,"e":0.68,"a":0.85,"n":0.28},"skills":[],
       "exp":5,"model":"presencial","smin":6000,"smax":9000,"loc":"Coronel Fabriciano, MG"},
    ]},
  { "name":"SiderMinas Aço","email":"siderminas@whymetest.com.br","industry":"Indústria","size":"500+",
    "website":"https://siderminas.com.br","linkedin_url":"https://linkedin.com/company/siderminas",
    "description":"Usina siderúrgica com 40+ anos no Vale do Aço.","cult":"industria",
    "jobs":[
      {"title":"Engenheiro de Produção","description":"Planejamento e controle na linha de laminação.",
       "ocean":{"o":0.48,"c":0.92,"e":0.32,"a":0.52,"n":0.10},"skills":[],
       "exp":3,"model":"presencial","smin":7000,"smax":11000,"loc":"Ipatinga, MG"},
      {"title":"Técnico de Segurança do Trabalho","description":"Fiscalização de NRs nas áreas de produção.",
       "ocean":{"o":0.38,"c":0.88,"e":0.28,"a":0.88,"n":0.08},"skills":[],
       "exp":2,"model":"presencial","smin":3500,"smax":5000,"loc":"Ipatinga, MG"},
    ]},
  { "name":"ValeMet Mineração","email":"valemet@whymetest.com.br","industry":"Indústria","size":"201-500",
    "website":"https://valemet.com.br","linkedin_url":"https://linkedin.com/company/valemet",
    "description":"Extração e beneficiamento de ferro no Vale do Rio Doce.","cult":"industria",
    "jobs":[
      {"title":"Geólogo de Minas","description":"Pesquisa e mapeamento de corpos de minério.",
       "ocean":{"o":0.58,"c":0.88,"e":0.35,"a":0.55,"n":0.12},"skills":[],
       "exp":4,"model":"presencial","smin":7000,"smax":11000,"loc":"Ipatinga, MG"},
      {"title":"Analista de Meio Ambiente","description":"Licenciamentos, PRAD e conformidade ambiental.",
       "ocean":{"o":0.65,"c":0.85,"e":0.42,"a":0.72,"n":0.18},"skills":[],
       "exp":3,"model":"hibrido","smin":5000,"smax":8000,"loc":"Ipatinga, MG"},
    ]},
  { "name":"SerraVerde Agropecuária","email":"serraverde@whymetest.com.br","industry":"Indústria","size":"51-200",
    "website":"https://serraverde.com.br","linkedin_url":"https://linkedin.com/company/serraverde",
    "description":"Produção agropecuária e consultoria rural no Leste de MG.","cult":"industria",
    "jobs":[
      {"title":"Engenheiro Agrônomo","description":"Gestão técnica de lavouras de café e pastagens.",
       "ocean":{"o":0.55,"c":0.85,"e":0.48,"a":0.68,"n":0.15},"skills":[],
       "exp":3,"model":"presencial","smin":5000,"smax":8000,"loc":"Governador Valadares, MG"},
      {"title":"Técnico Agropecuário","description":"Suporte técnico a produtores rurais da região.",
       "ocean":{"o":0.42,"c":0.82,"e":0.40,"a":0.72,"n":0.20},"skills":[],
       "exp":1,"model":"presencial","smin":3000,"smax":4500,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"CapitalConsult BH","email":"capitalconsult@whymetest.com.br","industry":"Consultoria","size":"11-50",
    "website":"https://capitalconsult.com.br","linkedin_url":"https://linkedin.com/company/capitalconsult",
    "description":"Boutique de consultoria estratégica para o middle market mineiro.","cult":"consultoria",
    "jobs":[
      {"title":"Consultor de Negócios","description":"Reestruturação e expansão de mercado para médias empresas.",
       "ocean":{"o":0.85,"c":0.78,"e":0.85,"a":0.62,"n":0.32},"skills":[],
       "exp":3,"model":"hibrido","smin":7000,"smax":12000,"loc":"Belo Horizonte, MG"},
      {"title":"Analista Financeiro","description":"Modelagem, valuation e due diligence de M&A.",
       "ocean":{"o":0.38,"c":0.95,"e":0.22,"a":0.38,"n":0.08},"skills":["Python","SQL"],
       "exp":2,"model":"remoto","smin":5500,"smax":9000,"loc":"Belo Horizonte, MG"},
    ]},
  { "name":"MG Estratégia Consultores","email":"mgestrategia@whymetest.com.br","industry":"Consultoria","size":"11-50",
    "website":"https://mgestrategia.com.br","linkedin_url":"https://linkedin.com/company/mgestrategia",
    "description":"Consultoria de processos e gestão de projetos em BH.","cult":"consultoria",
    "jobs":[
      {"title":"Gerente de Projetos (PMO)","description":"Gestão de portfólio de projetos de transformação digital.",
       "ocean":{"o":0.70,"c":0.85,"e":0.75,"a":0.72,"n":0.22},"skills":[],
       "exp":5,"model":"hibrido","smin":7000,"smax":11000,"loc":"Belo Horizonte, MG"},
      {"title":"Analista de Processos (BPM)","description":"Mapeamento e melhoria de processos operacionais.",
       "ocean":{"o":0.55,"c":0.90,"e":0.40,"a":0.65,"n":0.15},"skills":["SQL"],
       "exp":2,"model":"hibrido","smin":4500,"smax":7000,"loc":"Belo Horizonte, MG"},
    ]},
  { "name":"ValeMercado Atacadista","email":"valemercado@whymetest.com.br","industry":"Varejo","size":"201-500",
    "website":"https://valemercado.com.br","linkedin_url":"https://linkedin.com/company/valemercado",
    "description":"Atacadista com 12 filiais no Vale do Rio Doce.","cult":"varejo",
    "jobs":[
      {"title":"Supervisor de Vendas","description":"Gestão de equipe de 8 vendedores externos na região.",
       "ocean":{"o":0.55,"c":0.72,"e":0.92,"a":0.72,"n":0.25},"skills":[],
       "exp":3,"model":"presencial","smin":4000,"smax":7000,"loc":"Governador Valadares, MG"},
      {"title":"Analista de Logística","description":"Roteirização, estoque e gestão de fornecedores.",
       "ocean":{"o":0.28,"c":0.92,"e":0.28,"a":0.52,"n":0.08},"skills":["SQL"],
       "exp":1,"model":"presencial","smin":3500,"smax":5500,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"SuperMinas Supermercados","email":"superminas@whymetest.com.br","industry":"Varejo","size":"201-500",
    "website":"https://superminas.com.br","linkedin_url":"https://linkedin.com/company/superminas",
    "description":"Rede de supermercados com 8 lojas em Governador Valadares.","cult":"varejo",
    "jobs":[
      {"title":"Gerente de Loja","description":"Gestão completa de unidade com 60 colaboradores.",
       "ocean":{"o":0.52,"c":0.78,"e":0.85,"a":0.80,"n":0.28},"skills":[],
       "exp":4,"model":"presencial","smin":4500,"smax":7000,"loc":"Governador Valadares, MG"},
      {"title":"Auxiliar de Estoque","description":"Recebimento, conferência e organização de mercadorias.",
       "ocean":{"o":0.28,"c":0.80,"e":0.38,"a":0.75,"n":0.30},"skills":[],
       "exp":0,"model":"presencial","smin":1500,"smax":2200,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"FashionVale Moda","email":"fashionvale@whymetest.com.br","industry":"Varejo","size":"11-50",
    "website":"https://fashionvale.com.br","linkedin_url":"https://linkedin.com/company/fashionvale",
    "description":"Rede de moda feminina com 5 lojas no Leste de MG.","cult":"varejo",
    "jobs":[
      {"title":"Consultor de Moda e Vendas","description":"Atendimento personalizado e metas de conversão.",
       "ocean":{"o":0.82,"c":0.65,"e":0.90,"a":0.70,"n":0.35},"skills":[],
       "exp":1,"model":"presencial","smin":2500,"smax":4500,"loc":"Governador Valadares, MG"},
      {"title":"Visual Merchandiser","description":"Vitrinismo e ambientação das lojas da rede.",
       "ocean":{"o":0.88,"c":0.72,"e":0.60,"a":0.68,"n":0.30},"skills":[],
       "exp":2,"model":"presencial","smin":2800,"smax":4000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"UniVale Educação","email":"univale@whymetest.com.br","industry":"Educação","size":"51-200",
    "website":"https://univale.edu.br","linkedin_url":"https://linkedin.com/company/univale",
    "description":"Centro universitário referência em Governador Valadares.","cult":"educacao",
    "jobs":[
      {"title":"Professor de Graduação","description":"Docência em cursos de Exatas e Tecnologia.",
       "ocean":{"o":0.78,"c":0.75,"e":0.78,"a":0.88,"n":0.30},"skills":[],
       "exp":3,"model":"presencial","smin":4000,"smax":7000,"loc":"Governador Valadares, MG"},
      {"title":"Coordenador Pedagógico","description":"Supervisão de cursos e qualidade acadêmica.",
       "ocean":{"o":0.68,"c":0.80,"e":0.72,"a":0.90,"n":0.25},"skills":[],
       "exp":5,"model":"presencial","smin":5000,"smax":8000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"Instituto Pleno","email":"institutopleno@whymetest.com.br","industry":"Educação","size":"51-200",
    "website":"https://institutopleno.com.br","linkedin_url":"https://linkedin.com/company/institutopleno",
    "description":"Colégio de ensino básico com foco em formação integral.","cult":"educacao",
    "jobs":[
      {"title":"Professor de Ensino Médio","description":"Docência de Matemática e Física no Ensino Médio.",
       "ocean":{"o":0.72,"c":0.78,"e":0.75,"a":0.85,"n":0.32},"skills":[],
       "exp":2,"model":"presencial","smin":2500,"smax":4000,"loc":"Governador Valadares, MG"},
      {"title":"Psicólogo Escolar","description":"Suporte socioemocional a alunos e famílias.",
       "ocean":{"o":0.70,"c":0.72,"e":0.65,"a":0.92,"n":0.38},"skills":[],
       "exp":2,"model":"presencial","smin":4000,"smax":6000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"BancaMinas Financeira","email":"bancaminas@whymetest.com.br","industry":"Finanças","size":"201-500",
    "website":"https://bancaminas.com.br","linkedin_url":"https://linkedin.com/company/bancaminas",
    "description":"Financeira especializada em crédito para PMEs mineiras.","cult":"financas",
    "jobs":[
      {"title":"Analista de Crédito","description":"Análise de risco e concessão de crédito para empresas.",
       "ocean":{"o":0.40,"c":0.92,"e":0.32,"a":0.52,"n":0.12},"skills":["SQL"],
       "exp":2,"model":"hibrido","smin":4500,"smax":7000,"loc":"Governador Valadares, MG"},
      {"title":"Gerente de Relacionamento","description":"Carteira de clientes PJ com foco em cross-sell.",
       "ocean":{"o":0.58,"c":0.80,"e":0.82,"a":0.78,"n":0.25},"skills":[],
       "exp":4,"model":"presencial","smin":5500,"smax":9000,"loc":"Governador Valadares, MG"},
    ]},
  { "name":"InvestVale Corretora","email":"investvale@whymetest.com.br","industry":"Finanças","size":"51-200",
    "website":"https://investvale.com.br","linkedin_url":"https://linkedin.com/company/investvale",
    "description":"Corretora de valores com foco no investidor mineiro.","cult":"financas",
    "jobs":[
      {"title":"Analista de Investimentos","description":"Análise fundamentalista e gestão de carteiras.",
       "ocean":{"o":0.50,"c":0.92,"e":0.28,"a":0.45,"n":0.10},"skills":["Python","SQL"],
       "exp":3,"model":"remoto","smin":6000,"smax":10000,"loc":"Belo Horizonte, MG"},
      {"title":"Especialista em Compliance","description":"Regulatório, BACEN, CVM e controles internos.",
       "ocean":{"o":0.42,"c":0.95,"e":0.25,"a":0.55,"n":0.08},"skills":[],
       "exp":4,"model":"remoto","smin":6000,"smax":9000,"loc":"Belo Horizonte, MG"},
    ]},
  { "name":"ComunicaMinas Agência","email":"comunicaminas@whymetest.com.br","industry":"Marketing","size":"11-50",
    "website":"https://comunicaminas.com.br","linkedin_url":"https://linkedin.com/company/comunicaminas",
    "description":"Agência de marketing digital especializada no mercado mineiro.","cult":"marketing",
    "jobs":[
      {"title":"Redator / Copywriter","description":"Copy para redes sociais, ads e e-mail marketing.",
       "ocean":{"o":0.88,"c":0.65,"e":0.72,"a":0.68,"n":0.40},"skills":[],
       "exp":1,"model":"hibrido","smin":3000,"smax":5500,"loc":"Governador Valadares, MG"},
      {"title":"Social Media Manager","description":"Gestão de redes sociais para carteira de 15 clientes.",
       "ocean":{"o":0.82,"c":0.68,"e":0.85,"a":0.72,"n":0.38},"skills":[],
       "exp":2,"model":"remoto","smin":3500,"smax":6000,"loc":"Governador Valadares, MG"},
    ]},
]

# ── Candidates (100) ──────────────────────────────────────────────────────────
# ocean keys: openness, conscientiousness, extraversion, agreeableness, neuroticism
CANDIDATES = [
  # ── Group A: Tech/Dev (15) ──
  {"name":"Ana Paula Santos","email":"ana.paula@whymetest.com.br","headline":"Dev Full Stack — React, Python, AWS",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99821-4455","level":"senior","exp":6,"model":"hibrido","smin":9000,"smax":14000,
   "linkedin":"https://linkedin.com/in/anapaulasantos","edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.82,"conscientiousness":0.85,"extraversion":0.62,"agreeableness":0.75,"neuroticism":0.18}},

  {"name":"Felipe Oliveira","email":"felipe.oliveira@whymetest.com.br","headline":"Dev Full Stack — Node.js, React, TypeScript",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99117-6643","level":"pleno","exp":4,"model":"remoto","smin":7000,"smax":11000,
   "linkedin":"https://linkedin.com/in/felipeoliveira-dev","edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.78,"conscientiousness":0.82,"extraversion":0.58,"agreeableness":0.72,"neuroticism":0.20}},

  {"name":"Lucas Ferreira","email":"lucas.ferreira@whymetest.com.br","headline":"Desenvolvedor Backend Python — APIs REST e microserviços",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98832-5501","level":"pleno","exp":3,"model":"remoto","smin":6000,"smax":10000,
   "linkedin":"https://linkedin.com/in/lucasferreira-dev","edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.75,"conscientiousness":0.83,"extraversion":0.42,"agreeableness":0.68,"neuroticism":0.20}},

  {"name":"Mateus Oliveira","email":"mateus.oliveira@whymetest.com.br","headline":"Dev Full Stack Junior — React e Node",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99244-7712","level":"junior","exp":1,"model":"remoto","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Análise e Desenvolvimento de Sistemas","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.72,"conscientiousness":0.78,"extraversion":0.50,"agreeableness":0.70,"neuroticism":0.25}},

  {"name":"Vinícius Vieira","email":"vinicius.vieira@whymetest.com.br","headline":"Engenheiro de Software Sênior — Arquitetura e Liderança Técnica",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98901-3355","level":"senior","exp":7,"model":"hibrido","smin":10000,"smax":16000,
   "linkedin":"https://linkedin.com/in/viniciusvieira","edu":{"level":"Pós-graduação","course":"Engenharia de Software","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"}],
   "ocean":{"openness":0.80,"conscientiousness":0.85,"extraversion":0.55,"agreeableness":0.70,"neuroticism":0.18}},

  {"name":"Rodrigo Pinto","email":"rodrigo.pinto@whymetest.com.br","headline":"Dev Backend Python — FastAPI, PostgreSQL, Docker",
   "city":"Ipatinga","state":"MG","phone":"(31) 98420-6614","level":"pleno","exp":3,"model":"hibrido","smin":6500,"smax":10000,
   "linkedin":"https://linkedin.com/in/rodrigopinto","edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.70,"conscientiousness":0.84,"extraversion":0.38,"agreeableness":0.65,"neuroticism":0.20}},

  {"name":"Thiago Teixeira","email":"thiago.teixeira@whymetest.com.br","headline":"DevOps Engineer — Kubernetes, CI/CD, AWS",
   "city":"Ipatinga","state":"MG","phone":"(31) 99305-8872","level":"pleno","exp":4,"model":"remoto","smin":8000,"smax":12000,
   "linkedin":"https://linkedin.com/in/thiagoteixeira-devops","edu":{"level":"Graduação","course":"Redes de Computadores","institution":"IFMG"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.65,"conscientiousness":0.88,"extraversion":0.40,"agreeableness":0.62,"neuroticism":0.15}},

  {"name":"Fábio Campos","email":"fabio.campos@whymetest.com.br","headline":"Desenvolvedor Mobile React Native",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98765-2234","level":"pleno","exp":3,"model":"remoto","smin":6000,"smax":9500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.78,"conscientiousness":0.80,"extraversion":0.52,"agreeableness":0.70,"neuroticism":0.22}},

  {"name":"Guilherme Machado","email":"guilherme.machado@whymetest.com.br","headline":"Arquiteto de Software — Microsserviços e Cloud",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 98501-1122","level":"senior","exp":8,"model":"remoto","smin":12000,"smax":18000,
   "linkedin":"https://linkedin.com/in/guilhermemachado","edu":{"level":"Mestrado","course":"Ciência da Computação","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"}],
   "ocean":{"openness":0.82,"conscientiousness":0.86,"extraversion":0.55,"agreeableness":0.68,"neuroticism":0.18}},

  {"name":"Alexandre Moreira","email":"alexandre.moreira@whymetest.com.br","headline":"Dev Full Stack Junior — React e Django",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99033-7756","level":"junior","exp":1,"model":"remoto","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Análise e Desenvolvimento de Sistemas","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.74,"conscientiousness":0.78,"extraversion":0.48,"agreeableness":0.72,"neuroticism":0.28}},

  {"name":"Bernardo Correia","email":"bernardo.correia@whymetest.com.br","headline":"Desenvolvedor Full Stack Sênior — Vue.js e Python",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99877-4433","level":"senior","exp":6,"model":"hibrido","smin":9000,"smax":13000,
   "linkedin":"https://linkedin.com/in/bernardocorreia","edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.80,"conscientiousness":0.84,"extraversion":0.52,"agreeableness":0.70,"neuroticism":0.18}},

  {"name":"Wagner Mendes","email":"wagner.mendes@whymetest.com.br","headline":"Desenvolvedor Frontend — React, Next.js",
   "city":"Coronel Fabriciano","state":"MG","phone":"(31) 98612-9901","level":"pleno","exp":3,"model":"remoto","smin":5500,"smax":8500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.76,"conscientiousness":0.80,"extraversion":0.48,"agreeableness":0.70,"neuroticism":0.22}},

  {"name":"Olívia Ribeiro","email":"olivia.ribeiro@whymetest.com.br","headline":"Desenvolvedora Full Stack — Python e React",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99452-6680","level":"pleno","exp":3,"model":"hibrido","smin":6000,"smax":9500,
   "linkedin":"https://linkedin.com/in/oliviaribeiro","edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"},{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.79,"conscientiousness":0.82,"extraversion":0.55,"agreeableness":0.72,"neuroticism":0.20}},

  {"name":"Fernanda Costa","email":"fernanda.costa@whymetest.com.br","headline":"Engenheira de Software Sênior — Backend e Dados",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 99104-3377","level":"senior","exp":7,"model":"remoto","smin":11000,"smax":16000,
   "linkedin":"https://linkedin.com/in/fernandacosta-eng","edu":{"level":"Mestrado","course":"Engenharia de Software","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"}],
   "ocean":{"openness":0.82,"conscientiousness":0.86,"extraversion":0.58,"agreeableness":0.72,"neuroticism":0.18}},

  {"name":"Danilo Borges","email":"danilo.borges@whymetest.com.br","headline":"Dev Backend Junior — Node.js e PostgreSQL",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98823-5519","level":"junior","exp":1,"model":"remoto","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.71,"conscientiousness":0.79,"extraversion":0.40,"agreeableness":0.66,"neuroticism":0.28}},

  # ── Group B: Data / Analytics / Finance (15) ──
  {"name":"Henrique Alves","email":"henrique.alves@whymetest.com.br","headline":"Analista Financeiro — Modelagem e Valuation",
   "city":"Coronel Fabriciano","state":"MG","phone":"(31) 99432-1188","level":"pleno","exp":4,"model":"remoto","smin":6000,"smax":9500,
   "linkedin":"https://linkedin.com/in/henriquealvesfinancas","edu":{"level":"Pós-graduação","course":"Finanças Corporativas","institution":"IBMEC"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"}],
   "ocean":{"openness":0.38,"conscientiousness":0.95,"extraversion":0.22,"agreeableness":0.38,"neuroticism":0.08}},

  {"name":"Diego Ferreira","email":"diego.ferreira@whymetest.com.br","headline":"Engenheiro de Produção — Lean e Six Sigma",
   "city":"Ipatinga","state":"MG","phone":"(31) 98421-7765","level":"senior","exp":7,"model":"presencial","smin":8000,"smax":12000,
   "linkedin":"https://linkedin.com/in/diegoferreiraeng","edu":{"level":"Graduação","course":"Engenharia de Produção","institution":"UFOP"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.50,"conscientiousness":0.90,"extraversion":0.32,"agreeableness":0.55,"neuroticism":0.12}},

  {"name":"Mariana Carvalho","email":"mariana.carvalho@whymetest.com.br","headline":"Cientista de Dados — ML, Python e Visualização",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99761-0034","level":"pleno","exp":3,"model":"remoto","smin":7000,"smax":11000,
   "linkedin":"https://linkedin.com/in/marianacarvalho-data","edu":{"level":"Pós-graduação","course":"Ciência de Dados","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.70,"conscientiousness":0.90,"extraversion":0.32,"agreeableness":0.60,"neuroticism":0.12}},

  {"name":"Paulo Moura","email":"paulo.moura@whymetest.com.br","headline":"Engenheiro de Dados — Pipelines ETL e Cloud",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98654-2218","level":"senior","exp":6,"model":"remoto","smin":9000,"smax":14000,
   "linkedin":"https://linkedin.com/in/paulomoura-data","edu":{"level":"Mestrado","course":"Ciência da Computação","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.55,"conscientiousness":0.92,"extraversion":0.28,"agreeableness":0.58,"neuroticism":0.10}},

  {"name":"Carlos Pereira","email":"carlos.pereira@whymetest.com.br","headline":"Analista de BI — Power BI, SQL e Data Warehouse",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99503-8841","level":"pleno","exp":4,"model":"hibrido","smin":5500,"smax":8500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.52,"conscientiousness":0.88,"extraversion":0.35,"agreeableness":0.62,"neuroticism":0.14}},

  {"name":"Natália Gomes","email":"natalia.gomes@whymetest.com.br","headline":"Analista de Dados — Python, SQL e Tableau",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 99012-4456","level":"pleno","exp":3,"model":"remoto","smin":6000,"smax":9500,
   "linkedin":"https://linkedin.com/in/nataliagomes-data","edu":{"level":"Graduação","course":"Estatística","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.62,"conscientiousness":0.88,"extraversion":0.35,"agreeableness":0.62,"neuroticism":0.15}},

  {"name":"Sérgio Cardoso","email":"sergio.cardoso@whymetest.com.br","headline":"Analista de Crédito — Risco e Políticas de Concessão",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98740-1193","level":"pleno","exp":4,"model":"hibrido","smin":4500,"smax":7000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciências Contábeis","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.42,"conscientiousness":0.90,"extraversion":0.30,"agreeableness":0.52,"neuroticism":0.12}},

  {"name":"Vanessa Teixeira","email":"vanessa.teixeira@whymetest.com.br","headline":"Analista de Investimentos — Renda Variável e FIIs",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99288-0067","level":"pleno","exp":3,"model":"remoto","smin":6000,"smax":9000,
   "linkedin":"https://linkedin.com/in/vanessateixeira-invest","edu":{"level":"Pós-graduação","course":"Mercado de Capitais","institution":"IBMEC"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.50,"conscientiousness":0.92,"extraversion":0.28,"agreeableness":0.45,"neuroticism":0.10}},

  {"name":"Nelson Ribeiro","email":"nelson.ribeiro@whymetest.com.br","headline":"Especialista em Compliance — BACEN, CVM e PLD",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 98800-2234","level":"senior","exp":8,"model":"remoto","smin":8000,"smax":12000,
   "linkedin":"https://linkedin.com/in/nelsonribeiro-compliance","edu":{"level":"Pós-graduação","course":"Direito Empresarial","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"}],
   "ocean":{"openness":0.42,"conscientiousness":0.95,"extraversion":0.25,"agreeableness":0.55,"neuroticism":0.08}},

  {"name":"Cláudia Correia","email":"claudia.correia@whymetest.com.br","headline":"Analista Financeira Sênior — Controladoria e FP&A",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99645-3312","level":"senior","exp":7,"model":"hibrido","smin":7500,"smax":11000,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Finanças Corporativas","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.40,"conscientiousness":0.92,"extraversion":0.30,"agreeableness":0.50,"neuroticism":0.12}},

  {"name":"Ricardo Freitas","email":"ricardo.freitas@whymetest.com.br","headline":"Analista de QA — Automação com Selenium e Cypress",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98914-4422","level":"pleno","exp":3,"model":"remoto","smin":5000,"smax":8000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciência da Computação","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.45,"conscientiousness":0.90,"extraversion":0.28,"agreeableness":0.72,"neuroticism":0.12}},

  {"name":"Hanna Machado","email":"hanna.machado@whymetest.com.br","headline":"Analista de Processos — BPM e Melhoria Contínua",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99037-5580","level":"pleno","exp":3,"model":"hibrido","smin":4500,"smax":7000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.55,"conscientiousness":0.90,"extraversion":0.38,"agreeableness":0.65,"neuroticism":0.15}},

  {"name":"Kleber Monteiro","email":"kleber.monteiro@whymetest.com.br","headline":"Técnico de Produção Industrial — Controle de Qualidade",
   "city":"Timóteo","state":"MG","phone":"(31) 98765-4321","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Controle de Qualidade","institution":"SENAI Timóteo"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.48,"conscientiousness":0.88,"extraversion":0.32,"agreeableness":0.55,"neuroticism":0.14}},

  {"name":"Letícia Monteiro","email":"leticia.monteiro@whymetest.com.br","headline":"Analista Contábil Junior — Contas a Pagar e Receber",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99154-6601","level":"junior","exp":1,"model":"presencial","smin":2500,"smax":3800,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciências Contábeis","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.40,"conscientiousness":0.85,"extraversion":0.28,"agreeableness":0.58,"neuroticism":0.18}},

  {"name":"Patrick Brito","email":"patrick.brito@whymetest.com.br","headline":"Analista de Sistemas — Integração e APIs",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98923-7714","level":"pleno","exp":3,"model":"hibrido","smin":5000,"smax":8000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Sistemas de Informação","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.88,"extraversion":0.35,"agreeableness":0.60,"neuroticism":0.15}},

  # ── Group C: Sales / Commercial (12) ──
  {"name":"Isabela Nunes","email":"isabela.nunes@whymetest.com.br","headline":"Supervisora de Vendas — B2B e Varejo Atacadista",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99988-7720","level":"pleno","exp":5,"model":"presencial","smin":4500,"smax":7500,
   "linkedin":"https://linkedin.com/in/isabelanunes-vendas","edu":{"level":"Graduação","course":"Marketing","institution":"DOCTUM"},
   "langs":[{"language":"Espanhol","level":"Intermediário"}],
   "ocean":{"openness":0.55,"conscientiousness":0.72,"extraversion":0.92,"agreeableness":0.72,"neuroticism":0.25}},

  {"name":"André Lima","email":"andre.lima@whymetest.com.br","headline":"Representante Comercial — Atacado e Varejo",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99661-3308","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":6000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIVALE"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.52,"conscientiousness":0.70,"extraversion":0.90,"agreeableness":0.75,"neuroticism":0.28}},

  {"name":"Priscila Rocha","email":"priscila.rocha@whymetest.com.br","headline":"Gerente Comercial — Desenvolvimento de Carteiras",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98804-5521","level":"senior","exp":8,"model":"presencial","smin":6000,"smax":9500,
   "linkedin":"https://linkedin.com/in/priscilarocha","edu":{"level":"Pós-graduação","course":"Gestão Comercial","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.75,"extraversion":0.90,"agreeableness":0.78,"neuroticism":0.25}},

  {"name":"Jeferson Guimarães","email":"jeferson.guimaraes@whymetest.com.br","headline":"Vendedor Externo — B2B Industrial",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99219-0043","level":"pleno","exp":3,"model":"presencial","smin":3000,"smax":5500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.50,"conscientiousness":0.68,"extraversion":0.88,"agreeableness":0.72,"neuroticism":0.30}},

  {"name":"Sabrina Dias","email":"sabrina.dias@whymetest.com.br","headline":"Consultora de Vendas — Moda e Varejo",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98711-3355","level":"junior","exp":1,"model":"presencial","smin":2000,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Marketing","institution":"UNIPAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.48,"conscientiousness":0.65,"extraversion":0.85,"agreeableness":0.75,"neuroticism":0.35}},

  {"name":"Leandro Carvalho","email":"leandro.carvalho@whymetest.com.br","headline":"Executivo de Vendas Sênior — Agro e Indústria",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99534-8870","level":"senior","exp":9,"model":"presencial","smin":6000,"smax":10000,
   "linkedin":"https://linkedin.com/in/leandrocarvalho","edu":{"level":"Pós-graduação","course":"MBA em Gestão Comercial","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.60,"conscientiousness":0.72,"extraversion":0.88,"agreeableness":0.70,"neuroticism":0.25}},

  {"name":"Simone Leal","email":"simone.leal@whymetest.com.br","headline":"Supervisora Comercial — Inside Sales e Funil",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98856-7741","level":"pleno","exp":5,"model":"hibrido","smin":4000,"smax":6500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Marketing","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.55,"conscientiousness":0.75,"extraversion":0.88,"agreeableness":0.75,"neuroticism":0.28}},

  {"name":"Tiago Andrade","email":"tiago.andrade@whymetest.com.br","headline":"Representante de Vendas — Produtos Siderúrgicos",
   "city":"Ipatinga","state":"MG","phone":"(31) 98602-4419","level":"junior","exp":2,"model":"presencial","smin":2500,"smax":4000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.48,"conscientiousness":0.68,"extraversion":0.85,"agreeableness":0.72,"neuroticism":0.32}},

  {"name":"Raíssa Moura","email":"raissa.moura@whymetest.com.br","headline":"Gerente de Vendas — E-commerce e Omnichannel",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99378-6650","level":"senior","exp":7,"model":"hibrido","smin":6500,"smax":10000,
   "linkedin":"https://linkedin.com/in/raissamoura","edu":{"level":"Pós-graduação","course":"Marketing Digital","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.60,"conscientiousness":0.75,"extraversion":0.90,"agreeableness":0.72,"neuroticism":0.25}},

  {"name":"Daniel Fonseca","email":"daniel.fonseca@whymetest.com.br","headline":"Consultor Comercial — SaaS e Tecnologia",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99107-2245","level":"pleno","exp":4,"model":"hibrido","smin":5000,"smax":8000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.52,"conscientiousness":0.72,"extraversion":0.88,"agreeableness":0.70,"neuroticism":0.28}},

  {"name":"Keila Guimarães","email":"keila.guimaraes@whymetest.com.br","headline":"Vendedora — Moda e Acessórios",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98934-1109","level":"junior","exp":1,"model":"presencial","smin":1800,"smax":3000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Marketing","institution":"DOCTUM"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.45,"conscientiousness":0.65,"extraversion":0.85,"agreeableness":0.78,"neuroticism":0.35}},

  {"name":"Valdir Tavares","email":"valdir.tavares@whymetest.com.br","headline":"Representante Comercial — Atacado de Alimentos",
   "city":"Timóteo","state":"MG","phone":"(31) 99254-8812","level":"pleno","exp":5,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.50,"conscientiousness":0.70,"extraversion":0.88,"agreeableness":0.72,"neuroticism":0.30}},

  # ── Group D: Admin / Reception / Support (12) ──
  {"name":"Gabriela Costa","email":"gabriela.costa@whymetest.com.br","headline":"Assistente Administrativa — Atendimento e Faturamento",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98856-3390","level":"junior","exp":1,"model":"presencial","smin":2000,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIPAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.32,"conscientiousness":0.80,"extraversion":0.52,"agreeableness":0.90,"neuroticism":0.38}},

  {"name":"Sandra Pinto","email":"sandra.pinto@whymetest.com.br","headline":"Recepcionista Hospitalar — Triagem e Agendamento",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99211-6635","level":"junior","exp":2,"model":"presencial","smin":1800,"smax":3000,
   "linkedin":None,"edu":{"level":"Técnico","course":"Enfermagem","institution":"SENAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.38,"conscientiousness":0.75,"extraversion":0.70,"agreeableness":0.92,"neuroticism":0.40}},

  {"name":"Wanda Nogueira","email":"wanda.nogueira@whymetest.com.br","headline":"Assistente Administrativa Pleno — Rotinas e Contratos",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98701-4422","level":"pleno","exp":4,"model":"presencial","smin":2800,"smax":4200,
   "linkedin":None,"edu":{"level":"Graduação","course":"Secretariado Executivo","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.30,"conscientiousness":0.82,"extraversion":0.52,"agreeableness":0.90,"neuroticism":0.35}},

  {"name":"Lúcia Tavares","email":"lucia.tavares@whymetest.com.br","headline":"Secretária Executiva — Gestão de Agenda e Viagens",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99533-1178","level":"pleno","exp":6,"model":"presencial","smin":3500,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Secretariado Executivo","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.35,"conscientiousness":0.85,"extraversion":0.55,"agreeableness":0.88,"neuroticism":0.32}},

  {"name":"Carla Azevedo","email":"carla.azevedo@whymetest.com.br","headline":"Auxiliar Administrativa — Atendimento ao Cliente",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98809-9956","level":"junior","exp":1,"model":"presencial","smin":1600,"smax":2800,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIPAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.28,"conscientiousness":0.78,"extraversion":0.48,"agreeableness":0.88,"neuroticism":0.42}},

  {"name":"Sônia Coelho","email":"sonia.coelho@whymetest.com.br","headline":"Recepcionista — Clínicas e Consultórios",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99347-5512","level":"junior","exp":2,"model":"presencial","smin":1800,"smax":3000,
   "linkedin":None,"edu":{"level":"Técnico","course":"Administração","institution":"SENAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.35,"conscientiousness":0.72,"extraversion":0.72,"agreeableness":0.92,"neuroticism":0.42}},

  {"name":"Cristina Alves","email":"cristina.alves@whymetest.com.br","headline":"Assistente de RH — Admissão, Férias e Folha",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98762-0031","level":"junior","exp":2,"model":"presencial","smin":2200,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Gestão de Recursos Humanos","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.40,"conscientiousness":0.80,"extraversion":0.60,"agreeableness":0.88,"neuroticism":0.36}},

  {"name":"Roberta Souza","email":"roberta.souza@whymetest.com.br","headline":"Auxiliar de Estoque — Recebimento e Inventário",
   "city":"Coronel Fabriciano","state":"MG","phone":"(31) 98511-7724","level":"junior","exp":1,"model":"presencial","smin":1500,"smax":2500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Logística","institution":"SENAI"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.28,"conscientiousness":0.80,"extraversion":0.38,"agreeableness":0.75,"neuroticism":0.32}},

  {"name":"Adriana Batista","email":"adriana.batista@whymetest.com.br","headline":"Assistente Financeira — Contas a Pagar e Conciliação",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99428-6647","level":"pleno","exp":4,"model":"presencial","smin":2800,"smax":4500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciências Contábeis","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.35,"conscientiousness":0.85,"extraversion":0.40,"agreeableness":0.80,"neuroticism":0.30}},

  {"name":"Mônica Pires","email":"monica.pires@whymetest.com.br","headline":"Recepcionista de Clínica — Atendimento Humanizado",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98834-2280","level":"junior","exp":1,"model":"presencial","smin":1800,"smax":2800,
   "linkedin":None,"edu":{"level":"Técnico","course":"Saúde","institution":"SENAC"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.35,"conscientiousness":0.75,"extraversion":0.68,"agreeableness":0.92,"neuroticism":0.40}},

  {"name":"Nayara Xavier","email":"nayara.xavier@whymetest.com.br","headline":"Assistente de Faturamento — TISS e Convênios",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99067-4413","level":"junior","exp":2,"model":"presencial","smin":2200,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.38,"conscientiousness":0.85,"extraversion":0.35,"agreeableness":0.78,"neuroticism":0.28}},

  {"name":"Hélio Ramos","email":"helio.ramos@whymetest.com.br","headline":"Auxiliar Administrativo — Rotinas de Escritório",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98799-5531","level":"junior","exp":1,"model":"presencial","smin":1600,"smax":2500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Administração","institution":"SENAC"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.30,"conscientiousness":0.78,"extraversion":0.42,"agreeableness":0.82,"neuroticism":0.38}},

  # ── Group E: Industrial / Engineering (10) ──
  {"name":"Bruno Carvalho","email":"bruno.carvalho@whymetest.com.br","headline":"Técnico de Segurança — NR-12, NR-33, CIPA",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98734-2210","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Segurança do Trabalho","institution":"SENAI"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.30,"conscientiousness":0.88,"extraversion":0.25,"agreeableness":0.88,"neuroticism":0.08}},

  {"name":"Eduardo Martins","email":"eduardo.martins@whymetest.com.br","headline":"Engenheiro de Produção — Melhoria Contínua e Kaizen",
   "city":"Ipatinga","state":"MG","phone":"(31) 99301-6677","level":"pleno","exp":4,"model":"presencial","smin":6000,"smax":9000,
   "linkedin":"https://linkedin.com/in/eduardomartinseng","edu":{"level":"Graduação","course":"Engenharia de Produção","institution":"UFOP"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.48,"conscientiousness":0.90,"extraversion":0.30,"agreeableness":0.55,"neuroticism":0.12}},

  {"name":"Fabrício Araújo","email":"fabricio.araujo@whymetest.com.br","headline":"Eng. de Produção Junior — Controle de Processo",
   "city":"Ipatinga","state":"MG","phone":"(31) 98422-5534","level":"junior","exp":1,"model":"presencial","smin":4000,"smax":6000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Engenharia de Produção","institution":"IFMG"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.45,"conscientiousness":0.85,"extraversion":0.32,"agreeableness":0.58,"neuroticism":0.15}},

  {"name":"Gustavo Melo","email":"gustavo.melo@whymetest.com.br","headline":"Técnico Agropecuário — Cafeicultura e Pecuária de Corte",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99187-2240","level":"pleno","exp":3,"model":"presencial","smin":3000,"smax":4500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Agropecuária","institution":"IFMG"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.42,"conscientiousness":0.82,"extraversion":0.40,"agreeableness":0.72,"neuroticism":0.20}},

  {"name":"Igor Barros","email":"igor.barros@whymetest.com.br","headline":"Geólogo — Pesquisa Mineral e Sondagem",
   "city":"Ipatinga","state":"MG","phone":"(31) 98702-3356","level":"pleno","exp":5,"model":"presencial","smin":6000,"smax":9500,
   "linkedin":"https://linkedin.com/in/igorbarros-geo","edu":{"level":"Graduação","course":"Geologia","institution":"UFOP"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.88,"extraversion":0.35,"agreeableness":0.55,"neuroticism":0.12}},

  {"name":"Éder Castro","email":"eder.castro@whymetest.com.br","headline":"Técnico de Segurança Junior — NRs e CIPA",
   "city":"Timóteo","state":"MG","phone":"(31) 99345-1128","level":"junior","exp":1,"model":"presencial","smin":2800,"smax":4000,
   "linkedin":None,"edu":{"level":"Técnico","course":"Segurança do Trabalho","institution":"SENAI"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.35,"conscientiousness":0.85,"extraversion":0.28,"agreeableness":0.85,"neuroticism":0.12}},

  {"name":"Osvaldo Dias","email":"osvaldo.dias@whymetest.com.br","headline":"Analista de Meio Ambiente — Licenciamentos e Resíduos",
   "city":"Ipatinga","state":"MG","phone":"(31) 98811-4423","level":"pleno","exp":5,"model":"hibrido","smin":5000,"smax":7500,
   "linkedin":"https://linkedin.com/in/osvaldodias-ambiental","edu":{"level":"Graduação","course":"Engenharia Ambiental","institution":"UFOP"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.65,"conscientiousness":0.85,"extraversion":0.42,"agreeableness":0.72,"neuroticism":0.18}},

  {"name":"Luís Pires","email":"luis.pires@whymetest.com.br","headline":"Engenheiro Agrônomo — Gestão Técnica de Lavouras",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99012-8850","level":"pleno","exp":4,"model":"presencial","smin":5000,"smax":7500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Agronomia","institution":"UFV"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.55,"conscientiousness":0.85,"extraversion":0.48,"agreeableness":0.68,"neuroticism":0.15}},

  {"name":"Márcio Xavier","email":"marcio.xavier@whymetest.com.br","headline":"Técnico Industrial — Manutenção e Controle",
   "city":"Ipatinga","state":"MG","phone":"(31) 98743-0045","level":"pleno","exp":5,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Eletromecânica","institution":"SENAI"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.42,"conscientiousness":0.85,"extraversion":0.32,"agreeableness":0.60,"neuroticism":0.15}},

  {"name":"Débora Cunha","email":"debora.cunha@whymetest.com.br","headline":"Analista Ambiental — ISO 14001 e Programas de Sustentabilidade",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98867-9923","level":"pleno","exp":3,"model":"hibrido","smin":4500,"smax":7000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Ciências Biológicas","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.62,"conscientiousness":0.82,"extraversion":0.40,"agreeableness":0.70,"neuroticism":0.18}},

  # ── Group F: Creative / Marketing / Design (10) ──
  {"name":"Camila Rodrigues","email":"camila.rodrigues@whymetest.com.br","headline":"Consultora de Negócios e Marketing Estratégico",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99650-8831","level":"pleno","exp":5,"model":"hibrido","smin":6000,"smax":10000,
   "linkedin":"https://linkedin.com/in/camilarodrigues","edu":{"level":"Pós-graduação","course":"MBA em Gestão Empresarial","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Fluente/Nativo"},{"language":"Espanhol","level":"Intermediário"}],
   "ocean":{"openness":0.88,"conscientiousness":0.55,"extraversion":0.88,"agreeableness":0.58,"neuroticism":0.42}},

  {"name":"Yasmin Vieira","email":"yasmin.vieira@whymetest.com.br","headline":"Social Media Manager — Meta Ads e Conteúdo",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99742-3310","level":"junior","exp":2,"model":"remoto","smin":2500,"smax":4500,
   "linkedin":"https://linkedin.com/in/yasminvieira","edu":{"level":"Graduação","course":"Comunicação Social","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.82,"conscientiousness":0.68,"extraversion":0.85,"agreeableness":0.72,"neuroticism":0.38}},

  {"name":"Amanda Mendes","email":"amanda.mendes@whymetest.com.br","headline":"Redatora / Copywriter — Conteúdo e Performance",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98923-0015","level":"pleno","exp":4,"model":"hibrido","smin":3500,"smax":6000,
   "linkedin":"https://linkedin.com/in/amandamendes-copy","edu":{"level":"Graduação","course":"Jornalismo","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.88,"conscientiousness":0.65,"extraversion":0.72,"agreeableness":0.68,"neuroticism":0.40}},

  {"name":"Bárbara Moreira","email":"barbara.moreira@whymetest.com.br","headline":"Visual Merchandiser — Vitrinismo e Ambientação",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99158-4478","level":"junior","exp":1,"model":"presencial","smin":2200,"smax":3800,
   "linkedin":None,"edu":{"level":"Graduação","course":"Design de Interiores","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.88,"conscientiousness":0.72,"extraversion":0.60,"agreeableness":0.68,"neuroticism":0.30}},

  {"name":"Flávia Castro","email":"flavia.castro@whymetest.com.br","headline":"UX/UI Designer — Figma, Design System e Pesquisa",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99403-7723","level":"pleno","exp":3,"model":"remoto","smin":4500,"smax":7500,
   "linkedin":"https://linkedin.com/in/flaviacastro-ux","edu":{"level":"Graduação","course":"Design Gráfico","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.88,"conscientiousness":0.70,"extraversion":0.65,"agreeableness":0.78,"neuroticism":0.25}},

  {"name":"Giovanna Campos","email":"giovanna.campos@whymetest.com.br","headline":"Diretora de Arte — Branding e Identidade Visual",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 98901-5543","level":"pleno","exp":5,"model":"hibrido","smin":5000,"smax":8500,
   "linkedin":"https://linkedin.com/in/giovannacampos","edu":{"level":"Graduação","course":"Design Gráfico","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.85,"conscientiousness":0.65,"extraversion":0.70,"agreeableness":0.70,"neuroticism":0.35}},

  {"name":"Ingrid Ramos","email":"ingrid.ramos@whymetest.com.br","headline":"Consultora de Moda — Personal Styling e Vendas",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99876-0034","level":"pleno","exp":4,"model":"presencial","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Marketing de Moda","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.82,"conscientiousness":0.65,"extraversion":0.90,"agreeableness":0.70,"neuroticism":0.35}},

  {"name":"Jaqueline Cavalcante","email":"jaqueline.cavalcante@whymetest.com.br","headline":"Criadora de Conteúdo — TikTok, Instagram e YouTube",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98712-3367","level":"junior","exp":1,"model":"remoto","smin":2000,"smax":4000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Comunicação Social","institution":"UNIPAC"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.85,"conscientiousness":0.60,"extraversion":0.85,"agreeableness":0.72,"neuroticism":0.42}},

  {"name":"Natan Rocha","email":"natan.rocha@whymetest.com.br","headline":"Designer Gráfico — Identidade Visual e Motion",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99561-2208","level":"pleno","exp":4,"model":"hibrido","smin":3500,"smax":6000,
   "linkedin":"https://linkedin.com/in/natanrocha-design","edu":{"level":"Graduação","course":"Design Gráfico","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.88,"conscientiousness":0.68,"extraversion":0.60,"agreeableness":0.70,"neuroticism":0.32}},

  {"name":"Ulisses Leal","email":"ulisses.leal@whymetest.com.br","headline":"Gestor de Marketing — Growth e Performance",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98834-0091","level":"pleno","exp":5,"model":"hibrido","smin":5500,"smax":9000,
   "linkedin":"https://linkedin.com/in/ulissesleal","edu":{"level":"Pós-graduação","course":"Marketing Digital","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.82,"conscientiousness":0.68,"extraversion":0.82,"agreeableness":0.68,"neuroticism":0.38}},

  # ── Group G: Education / Healthcare People (10) ──
  {"name":"Eduarda Lima","email":"eduarda.lima@whymetest.com.br","headline":"Gestora de RH — Desenvolvimento Organizacional",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 99203-5544","level":"senior","exp":8,"model":"hibrido","smin":7000,"smax":11000,
   "linkedin":"https://linkedin.com/in/eduardalima-rh","edu":{"level":"Pós-graduação","course":"Gestão de Pessoas","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.60,"conscientiousness":0.80,"extraversion":0.85,"agreeableness":0.90,"neuroticism":0.22}},

  {"name":"Helena Martins","email":"helena.martins@whymetest.com.br","headline":"Professora de Graduação — Engenharia e Tecnologia",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99412-0034","level":"pleno","exp":5,"model":"presencial","smin":4000,"smax":7000,
   "linkedin":"https://linkedin.com/in/helenamartins-prof","edu":{"level":"Mestrado","course":"Engenharia de Produção","institution":"UFMG"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.78,"conscientiousness":0.75,"extraversion":0.78,"agreeableness":0.88,"neuroticism":0.30}},

  {"name":"Juliana Araújo","email":"juliana.araujo@whymetest.com.br","headline":"Psicóloga Escolar — Desenvolvimento Infantojuvenil",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98801-5512","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":6000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Psicologia","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.70,"conscientiousness":0.72,"extraversion":0.65,"agreeableness":0.92,"neuroticism":0.38}},

  {"name":"Karolina Melo","email":"karolina.melo@whymetest.com.br","headline":"Coordenadora Pedagógica — Ensino Básico e Médio",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99673-1145","level":"pleno","exp":6,"model":"presencial","smin":4500,"smax":7500,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Gestão Escolar","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.68,"conscientiousness":0.80,"extraversion":0.72,"agreeableness":0.90,"neuroticism":0.25}},

  {"name":"Larissa Barros","email":"larissa.barros@whymetest.com.br","headline":"Professora de Matemática — Ensino Médio e Pré-vestibular",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98715-4430","level":"pleno","exp":4,"model":"presencial","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Matemática","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.72,"conscientiousness":0.78,"extraversion":0.75,"agreeableness":0.85,"neuroticism":0.32}},

  {"name":"Tatiana Cardoso","email":"tatiana.cardoso@whymetest.com.br","headline":"Psicóloga Clínica — TCC e Saúde Mental no Trabalho",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99214-8830","level":"pleno","exp":5,"model":"hibrido","smin":4000,"smax":7000,
   "linkedin":"https://linkedin.com/in/tatianacardoso-psi","edu":{"level":"Pós-graduação","course":"Psicologia Clínica","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.70,"conscientiousness":0.70,"extraversion":0.62,"agreeableness":0.90,"neuroticism":0.38}},

  {"name":"Renata Andrade","email":"renata.andrade@whymetest.com.br","headline":"Coordenadora Clínica — Gestão de Equipes de Saúde",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98906-2257","level":"pleno","exp":6,"model":"presencial","smin":5500,"smax":8500,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Gestão em Saúde","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.55,"conscientiousness":0.80,"extraversion":0.68,"agreeableness":0.85,"neuroticism":0.28}},

  {"name":"Miriam Figueiredo","email":"miriam.figueiredo@whymetest.com.br","headline":"Psicopedagoga — Dificuldades de Aprendizagem",
   "city":"Uberlândia","state":"MG","phone":"(34) 99034-5521","level":"pleno","exp":5,"model":"presencial","smin":3500,"smax":6000,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Psicopedagogia","institution":"UNIMONTES"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.72,"conscientiousness":0.75,"extraversion":0.70,"agreeableness":0.90,"neuroticism":0.32}},

  {"name":"Samuel Nogueira","email":"samuel.nogueira@whymetest.com.br","headline":"Professor de Matemática e Física — Cursinho e Ensino Médio",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99888-1234","level":"pleno","exp":4,"model":"presencial","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Física","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.68,"conscientiousness":0.80,"extraversion":0.72,"agreeableness":0.82,"neuroticism":0.28}},

  {"name":"Luciana Pereira","email":"luciana.pereira@whymetest.com.br","headline":"Técnica de Radiologia — TC, RX e Mamografia",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98743-9912","level":"pleno","exp":5,"model":"presencial","smin":3000,"smax":4500,
   "linkedin":None,"edu":{"level":"Técnico","course":"Radiologia","institution":"SENAC"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.42,"conscientiousness":0.85,"extraversion":0.38,"agreeableness":0.80,"neuroticism":0.18}},

  # ── Group H: Management / HR (8) ──
  {"name":"João Pedro Moura","email":"joao.pedro@whymetest.com.br","headline":"Analista de Logística em transição para Pleno",
   "city":"Timóteo","state":"MG","phone":"(31) 98321-6654","level":"junior","exp":2,"model":"presencial","smin":2500,"smax":4000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Logística","institution":"IFMG"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.40,"conscientiousness":0.82,"extraversion":0.38,"agreeableness":0.80,"neuroticism":0.20}},

  {"name":"Marcos Gomes","email":"marcos.gomes@whymetest.com.br","headline":"Gerente de Loja — Varejo e Gestão de Equipes",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99321-7788","level":"pleno","exp":5,"model":"presencial","smin":4500,"smax":7000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.52,"conscientiousness":0.78,"extraversion":0.85,"agreeableness":0.80,"neuroticism":0.28}},

  {"name":"Patrícia Nascimento","email":"patricia.nascimento@whymetest.com.br","headline":"Coordenadora de RH — T&D e Cultura Organizacional",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98823-4451","level":"pleno","exp":6,"model":"hibrido","smin":5000,"smax":8000,
   "linkedin":"https://linkedin.com/in/patricianascimento-rh","edu":{"level":"Pós-graduação","course":"Gestão de Pessoas","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.78,"extraversion":0.80,"agreeableness":0.88,"neuroticism":0.22}},

  {"name":"Otávio Nascimento","email":"otavio.nascimento@whymetest.com.br","headline":"Gerente de Projetos — PMO e Transformação Digital",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99456-0078","level":"senior","exp":9,"model":"hibrido","smin":8000,"smax":12000,
   "linkedin":"https://linkedin.com/in/otavionascimento-pmo","edu":{"level":"Pós-graduação","course":"Gestão de Projetos","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.70,"conscientiousness":0.85,"extraversion":0.75,"agreeableness":0.72,"neuroticism":0.22}},

  {"name":"Ivan Cavalcante","email":"ivan.cavalcante@whymetest.com.br","headline":"Gerente de Relacionamento Bancário — PJ",
   "city":"Belo Horizonte","state":"MG","phone":"(31) 98900-3312","level":"pleno","exp":6,"model":"presencial","smin":5500,"smax":9000,
   "linkedin":"https://linkedin.com/in/ivancavalcante","edu":{"level":"Graduação","course":"Administração","institution":"PUC Minas"},
   "langs":[{"language":"Inglês","level":"Avançado"}],
   "ocean":{"openness":0.58,"conscientiousness":0.80,"extraversion":0.82,"agreeableness":0.78,"neuroticism":0.25}},

  {"name":"Taiana Brito","email":"taiana.brito@whymetest.com.br","headline":"Coordenadora Administrativa — Processos e Controles",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99012-3344","level":"pleno","exp":5,"model":"presencial","smin":3800,"smax":6000,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Gestão Empresarial","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.45,"conscientiousness":0.82,"extraversion":0.65,"agreeableness":0.85,"neuroticism":0.28}},

  {"name":"Eduardo Campos","email":"eduardo.campos@whymetest.com.br","headline":"Gerente Operacional — Logística e Supply Chain",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98799-6612","level":"senior","exp":8,"model":"presencial","smin":7000,"smax":11000,
   "linkedin":"https://linkedin.com/in/eduardocampos-op","edu":{"level":"Pós-graduação","course":"Logística e Supply Chain","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.52,"conscientiousness":0.80,"extraversion":0.78,"agreeableness":0.78,"neuroticism":0.25}},

  {"name":"Wesley Azevedo","email":"wesley.azevedo@whymetest.com.br","headline":"Gerente Comercial Sênior — Grandes Contas",
   "city":"Montes Claros","state":"MG","phone":"(38) 99201-5533","level":"senior","exp":10,"model":"presencial","smin":7000,"smax":12000,
   "linkedin":"https://linkedin.com/in/wesleyazevedo","edu":{"level":"Pós-graduação","course":"MBA em Vendas","institution":"FGV"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.75,"extraversion":0.88,"agreeableness":0.72,"neuroticism":0.28}},

  # ── Group I: Mixed / Generalist (8) ──
  {"name":"Elaine Borges","email":"elaine.borges@whymetest.com.br","headline":"Assistente de Marketing — Redes Sociais e Eventos",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99344-7762","level":"junior","exp":1,"model":"hibrido","smin":2000,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Publicidade e Propaganda","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.55,"conscientiousness":0.68,"extraversion":0.60,"agreeableness":0.72,"neuroticism":0.35}},

  {"name":"Daniel Costa","email":"daniel.costa@whymetest.com.br","headline":"Analista Administrativo — Contratos e Licitações",
   "city":"Governador Valadares","state":"MG","phone":"(33) 98901-1123","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Direito","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.50,"conscientiousness":0.75,"extraversion":0.55,"agreeableness":0.72,"neuroticism":0.30}},

  {"name":"Márcio Borges","email":"marcio.borges@whymetest.com.br","headline":"Analista de Suporte — TI e Helpdesk",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99088-4412","level":"pleno","exp":3,"model":"presencial","smin":3000,"smax":5000,
   "linkedin":None,"edu":{"level":"Graduação","course":"Redes de Computadores","institution":"DOCTUM"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.48,"conscientiousness":0.72,"extraversion":0.52,"agreeableness":0.70,"neuroticism":0.32}},

  {"name":"Anderson Coelho","email":"anderson.coelho@whymetest.com.br","headline":"Consultor Junior — Projetos de Melhoria Organizacional",
   "city":"Uberlândia","state":"MG","phone":"(34) 98812-3309","level":"junior","exp":1,"model":"hibrido","smin":2500,"smax":4500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UFU"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.60,"conscientiousness":0.68,"extraversion":0.65,"agreeableness":0.65,"neuroticism":0.38}},

  {"name":"Vivian Freitas","email":"vivian.freitas@whymetest.com.br","headline":"Analista de Projetos — Escopo, Prazo e Qualidade",
   "city":"Montes Claros","state":"MG","phone":"(38) 99067-2201","level":"pleno","exp":4,"model":"hibrido","smin":4000,"smax":6500,
   "linkedin":None,"edu":{"level":"Pós-graduação","course":"Gerenciamento de Projetos","institution":"UNIMONTES"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.78,"extraversion":0.58,"agreeableness":0.70,"neuroticism":0.30}},

  {"name":"Karina Batista","email":"karina.batista@whymetest.com.br","headline":"Coordenadora de Compras — Negociação e Fornecedores",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99245-8870","level":"pleno","exp":5,"model":"presencial","smin":4000,"smax":6500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Administração","institution":"UNIVALE"},
   "langs":[{"language":"Inglês","level":"Básico"}],
   "ocean":{"openness":0.52,"conscientiousness":0.80,"extraversion":0.55,"agreeableness":0.72,"neuroticism":0.28}},

  {"name":"Rodrigo Fontes","email":"rodrigo.fontes@whymetest.com.br","headline":"Técnico de TI — Infraestrutura e Suporte N2",
   "city":"Juiz de Fora","state":"MG","phone":"(32) 98834-1156","level":"pleno","exp":4,"model":"presencial","smin":3500,"smax":5500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Redes de Computadores","institution":"UFJF"},
   "langs":[{"language":"Inglês","level":"Intermediário"}],
   "ocean":{"openness":0.58,"conscientiousness":0.75,"extraversion":0.48,"agreeableness":0.65,"neuroticism":0.30}},

  {"name":"Tânia Mota","email":"tania.mota@whymetest.com.br","headline":"Analista de Atendimento ao Cliente — SAC e Ouvidoria",
   "city":"Governador Valadares","state":"MG","phone":"(33) 99413-0061","level":"junior","exp":2,"model":"presencial","smin":2000,"smax":3500,
   "linkedin":None,"edu":{"level":"Graduação","course":"Comunicação Social","institution":"DOCTUM"},
   "langs":[{"language":"Espanhol","level":"Básico"}],
   "ocean":{"openness":0.45,"conscientiousness":0.72,"extraversion":0.68,"agreeableness":0.80,"neuroticism":0.38}},
]


# ── Seed functions (same as before) ──────────────────────────────────────────

def seed_company(client: httpx.Client, company: dict, skill_map: dict) -> tuple:
    name = company["name"]
    resp = client.post("/auth/register", json={
        "name": name, "email": company["email"],
        "password": PW, "role": "company",
    })
    if resp.status_code == 409:
        print(f"  [SKIP] {name}")
        return None, None, []

    login = ok(client.post("/auth/login", json={"email": company["email"], "password": PW}))
    token = login["access_token"]
    me = ok(client.get("/auth/me", headers=hdr(token)))
    cid = me.get("company_id")
    if not cid:
        print(f"  ! Sem company_id para {name}")
        return None, None, []

    h = hdr(token)
    client.patch(f"/companies/{cid}", json={
        "name": name, "description": company["description"],
        "industry": company["industry"], "size": company["size"],
        "website": company["website"], "linkedin_url": company["linkedin_url"],
    }, headers=h)

    cult_key = company.get("cult", "tech")
    cult_tmpl = CULT[cult_key]
    q_resp = client.get("/companies/culture-questions", headers=h)
    if q_resp.status_code == 200:
        qs = q_resp.json() if isinstance(q_resp.json(), list) else q_resp.json().get("questions", [])
        if qs:
            answers = [{"question_id": q["id"], "score": cult_tmpl[i % len(cult_tmpl)]} for i, q in enumerate(qs)]
            client.post(f"/companies/{cid}/culture-questionnaire", json={"answers": answers}, headers=h)

    job_ids = []
    for job in company["jobs"]:
        sids = [skill_map[s] for s in job.get("skills", []) if s in skill_map]
        r = client.post("/jobs", json={
            "company_id": cid,
            "title": job["title"], "description": job["description"],
            "ocean_ideal": job["ocean"],
            "hard_skills_required": sids,
            "education_level_min": None,
            "experience_years_min": job["exp"],
            "work_model": job["model"],
            "salary_min": job["smin"], "salary_max": job["smax"],
            "location": job["loc"],
        }, headers=h)
        if r.status_code in (200, 201):
            jid = r.json()["id"]
            job_ids.append(jid)
            client.patch(f"/jobs/{jid}/status", json={"status": "active"}, headers=h)
            print(f"    + {job['title']}")
        else:
            print(f"    ! {job['title']}: {r.text[:80]}")

    return cid, token, job_ids


def seed_candidate(client: httpx.Client, c: dict, skill_map: dict) -> str | None:
    name = c["name"]
    anon = client.post("/candidates/anonymous")
    if anon.status_code not in (200, 201):
        print(f"  ! anon fail for {name}")
        return None
    a = anon.json()
    cid = a["candidate_id"]
    token_anon = a.get("token", "")
    iid = interview_id(a.get("interview_link", f"/interview/{cid}"))

    client.patch(f"/interviews/{iid}/status", json={"status": "started"})
    client.post(f"/interviews/{iid}/questionnaire", json={"respostas": scores_to_responses(c["ocean"])})

    conv = client.post("/candidates/convert", json={
        "candidate_id": cid, "token": token_anon,
        "email": c["email"], "password": PW, "name": name,
    })
    if conv.status_code == 409:
        print(f"  [SKIP] {name}")
        return None
    if conv.status_code not in (200, 201):
        print(f"  ! convert fail {name}: {conv.text[:60]}")
        return None

    login = client.post("/auth/login", json={"email": c["email"], "password": PW})
    if login.status_code not in (200, 201):
        return None
    auth_token = login.json()["access_token"]
    h = hdr(auth_token)

    client.patch(f"/candidates/{cid}", json={"headline": c["headline"], "experience_years": c["exp"]}, headers=h)
    client.post(f"/candidates/{cid}/onboarding", json={
        "phone": c["phone"],
        "education": c["edu"],
        "languages": c["langs"],
        "hard_skills": [],
        "city": c["city"], "state": c["state"], "country": "Brasil",
        "salary_expectation": {"min": c["smin"], "max": c["smax"], "currency": "BRL"},
        "work_model": c["model"],
        "linkedin_url": c.get("linkedin"),
        "professional_level": c["level"],
    }, headers=h)

    mr = client.post(f"/matches/trigger/{iid}", headers=h)
    mc = mr.json().get("matches_created", 0) if mr.status_code in (200, 201) else "?"
    print(f"    + {name} ({c['city']}) — {mc} match(es)")
    return cid


# ── Main ──────────────────────────────────────────────────────────────────────

def seed():
    print("=" * 60)
    print("WhyMeApp Seed — 20 empresas · 40 vagas · 100 candidatos")
    print("=" * 60)

    with httpx.Client(base_url=API_BASE, timeout=30.0) as client:
        print("\n[1/3] Carregando hard skills...")
        skill_map: dict[str, str] = {}
        r = client.get("/candidates/reference-data")
        if r.status_code == 200:
            for s in r.json().get("hard_skills", []):
                skill_map[s["name"]] = s["id"]
        print(f"  {len(skill_map)} skills disponíveis")

        print("\n[2/3] Empresas e vagas...")
        co_ok, co_skip = 0, 0
        for co in COMPANIES:
            print(f"\n  {co['name']} ({co['industry']})")
            cid, _, _ = seed_company(client, co, skill_map)
            if cid: co_ok += 1
            else: co_skip += 1

        print(f"\n[3/3] Candidatos (100)...")
        ca_ok, ca_skip = 0, 0
        for i, c in enumerate(CANDIDATES, 1):
            print(f"\n  [{i:03d}/100] {c['name']}")
            cid = seed_candidate(client, c, skill_map)
            if cid: ca_ok += 1
            else: ca_skip += 1

    print("\n" + "=" * 60)
    print(f"Empresas:   {co_ok} criadas, {co_skip} puladas")
    print(f"Candidatos: {ca_ok} criados, {ca_skip} pulados")
    print("\nSenha universal: Test@12345")
    print("Exemplos de login:")
    print("  ana.paula@whymetest.com.br      (Dev Full Stack Sr)")
    print("  henrique.alves@whymetest.com.br (Analista Financeiro)")
    print("  techvalares@whymetest.com.br    (Empresa - Tecnologia)")
    print("Done.")


if __name__ == "__main__":
    seed()
