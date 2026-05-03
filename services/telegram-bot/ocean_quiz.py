QUESTIONS = [
    # Openness (O) — questions 1-6
    {"text": "Tem uma imaginação ativa e gosta de pensar em novas possibilidades", "dimension": "O", "reverse": False},
    {"text": "Tem interesse em aprender coisas novas, mesmo fora da sua área", "dimension": "O", "reverse": False},
    {"text": "Prefere tarefas previsíveis e rotineiras", "dimension": "O", "reverse": True},
    {"text": "Gosta de explorar diferentes jeitos de resolver um problema", "dimension": "O", "reverse": False},
    {"text": "Tem curiosidade intelectual e busca entender o porquê das coisas", "dimension": "O", "reverse": False},
    {"text": "Sente-se desconfortável com mudanças repentinas no trabalho", "dimension": "O", "reverse": True},
    # Conscientiousness (C) — questions 7-12
    {"text": "Cumpre prazos e compromissos com consistência", "dimension": "C", "reverse": False},
    {"text": "Organiza seu trabalho de forma estruturada e planejada", "dimension": "C", "reverse": False},
    {"text": "Tende a procrastinar tarefas importantes", "dimension": "C", "reverse": True},
    {"text": "Prefere ter objetivos claros e métricas para acompanhar seu progresso", "dimension": "C", "reverse": False},
    {"text": "Revisa seu próprio trabalho antes de entregar", "dimension": "C", "reverse": False},
    {"text": "Age de forma impulsiva sem pensar nas consequências", "dimension": "C", "reverse": True},
    # Extraversion (E) — questions 13-18
    {"text": "Sente-se energizado ao interagir com outras pessoas", "dimension": "E", "reverse": False},
    {"text": "Prefere trabalhar em silêncio e sozinho", "dimension": "E", "reverse": True},
    {"text": "Toma a iniciativa em conversas e reuniões", "dimension": "E", "reverse": False},
    {"text": "Sente-se desconfortável em eventos sociais com muitas pessoas", "dimension": "E", "reverse": True},
    {"text": "Gosta de ser o centro das atenções em apresentações", "dimension": "E", "reverse": False},
    {"text": "Prefere se comunicar por escrito do que pessoalmente", "dimension": "E", "reverse": True},
    # Agreeableness (A) — questions 19-24
    {"text": "Se preocupa genuinamente com o bem-estar dos colegas", "dimension": "A", "reverse": False},
    {"text": "Coloca suas próprias necessidades acima das do time", "dimension": "A", "reverse": True},
    {"text": "Busca consenso e harmonia em situações de conflito", "dimension": "A", "reverse": False},
    {"text": "É direto e objetivo, mesmo que isso soe rude", "dimension": "A", "reverse": True},
    {"text": "Oferece ajuda sem esperar nada em troca", "dimension": "A", "reverse": False},
    {"text": "Tem dificuldade em dizer não para novas demandas", "dimension": "A", "reverse": False},
    # Neuroticism (N) — questions 25-30
    {"text": "Mantém a calma sob pressão e prazos apertados", "dimension": "N", "reverse": True},
    {"text": "Costuma se preocupar excessivamente com erros pequenos", "dimension": "N", "reverse": False},
    {"text": "Lida bem com críticas e feedbacks construtivos", "dimension": "N", "reverse": True},
    {"text": "Sente-se ansioso antes de reuniões importantes", "dimension": "N", "reverse": False},
    {"text": "Deixa problemas do trabalho afetarem seu humor fora do expediente", "dimension": "N", "reverse": False},
    {"text": "Confia na sua capacidade de resolver problemas inesperados", "dimension": "N", "reverse": True},
]

LIKERT_OPTIONS = [
    ("1", "Discordo totalmente"),
    ("2", "Discordo"),
    ("3", "Neutro"),
    ("4", "Concordo"),
    ("5", "Concordo totalmente"),
]

DIMENSION_NAMES = {
    "O": "Abertura (Openness)",
    "C": "Conscienciosidade (Conscientiousness)",
    "E": "Extroversão (Extraversion)",
    "A": "Amabilidade (Agreeableness)",
    "N": "Neuroticismo (Neuroticism)",
}

_DESCRIPTIONS = {
    "O": {
        "high": "Você é altamente criativo e aberto a novas experiências. Tem curiosidade intelectual e aprecia explorar novas ideias e perspectivas.",
        "mid": "Você equilibra abertura a novas experiências com a valorização de rotinas estabelecidas. Adapta-se bem quando necessário.",
        "low": "Você prefere ambientes estruturados e previsíveis. Valoriza experiências conhecidas e tende a confiar em métodos testados.",
    },
    "C": {
        "high": "Você é muito organizado, confiável e disciplinado. Cumpre compromissos, planeja com cuidado e revisa seu trabalho com atenção.",
        "mid": "Você tem bom equilíbrio entre organização e flexibilidade. É confiável e consegue planejar quando necessário.",
        "low": "Você tende a ser espontâneo e flexível, adaptando-se conforme as situações surgem. Prefere menos estrutura formal.",
    },
    "E": {
        "high": "Você é sociável, assertivo e energizado pela interação com outras pessoas. Gosta de ambientes dinâmicos e sociais.",
        "mid": "Você adapta seu comportamento social conforme o contexto. Confortável tanto em grupo quanto em atividades individuais.",
        "low": "Você é mais introspectivo e prefere ambientes tranquilos. Recarrega as energias em momentos de solitude.",
    },
    "A": {
        "high": "Você é cooperativo, empático e se importa genuinamente com o bem-estar dos outros. Busca harmonia nas relações.",
        "mid": "Você equilibra cooperação com assertividade. Consegue ser colaborativo e direto conforme a situação exige.",
        "low": "Você é direto e assertivo, priorizando eficiência e resultados. Não hesita em expressar opiniões com franqueza.",
    },
    "N": {
        "high": "Você pode experimentar emoções mais intensas e reações ao estresse. Autoconhecimento e gestão emocional são seus pontos de desenvolvimento.",
        "mid": "Você gerencia bem as emoções na maioria das situações, com alguma variação natural em momentos de maior pressão.",
        "low": "Você é emocionalmente estável e resiliente. Mantém a calma sob pressão e lida bem com situações desafiadoras.",
    },
}


def calculate_scores(answers: list[int]) -> dict[str, float]:
    """Average Likert responses per OCEAN dimension, normalize to 0–100.
    Reverse-scored items use score = 6 - response before averaging.
    """
    dim_scores: dict[str, list[int]] = {"O": [], "C": [], "E": [], "A": [], "N": []}
    for i, answer in enumerate(answers):
        q = QUESTIONS[i]
        score = 6 - answer if q["reverse"] else answer
        dim_scores[q["dimension"]].append(score)

    return {
        dim: round((sum(scores) / len(scores) - 1) / 4 * 100, 1)
        for dim, scores in dim_scores.items()
    }


def _description(dim: str, score: float) -> str:
    d = _DESCRIPTIONS[dim]
    if score >= 67:
        return d["high"]
    if score >= 34:
        return d["mid"]
    return d["low"]


def _bar(score: float) -> str:
    filled = round(score / 10)
    return "█" * filled + "░" * (10 - filled)


def format_results_html(scores: dict[str, float]) -> str:
    lines = ["<b>🧠 Seu Perfil OCEAN</b>\n"]
    for key, name in DIMENSION_NAMES.items():
        score = scores[key]
        lines.append(f"<b>{name}</b>: {score:.0f}/100")
        lines.append(f"<code>{_bar(score)}</code>")
        lines.append(f"<i>{_description(key, score)}</i>\n")
    return "\n".join(lines)
