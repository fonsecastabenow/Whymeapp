# Estrutura Pirâmide — Entrevista OCEAN Adaptativa v4

## 📖 OPENNESS (Curiosidade, Adaptabilidade, Busca por Novidade)

**PERGUNTA TOPO:**
> "Imagina que seu time sempre fez um processo do mesmo jeito, e alguém propõe uma mudança grande. Qual sua primeira reação?"
> *Abre o tema sem viés. Avalia abertura instintiva.*

**VARIANTE A** (se respondeu aberto/curioso):
> "E quando a mudança parte de você? Já teve uma ideia sua que implementou e deu certo? Como foi?"
> *Testa se é proativo ou só reativo.*

**VARIANTE B** (se respondeu cauteloso/resistente):
> "Já aconteceu de seguir o método antigo te custar uma oportunidade ou fazer perder tempo?"
> *Testa se a resistência é convicção ou zona de conforto.*

**Sub-critérios:**
- `curiosidade_intelectual` — busca ativa por aprender?
- `adaptabilidade` — consegue pivotar quando necessário?
- `abertura_a_risco` — aceita incerteza ou precisa de garantias?

---

## 📋 CONSCIENTIOUSNESS (Organização, Planejamento, Detalhismo)

**PERGUNTA TOPO:**
> "Me descreve como você organiza uma semana de trabalho típica. Você planeja cada dia ou vai na intuição?"
> *Neutro. Observa o modus operandi real.*

**VARIANTE A** (se respondeu estruturado/planejador):
> "E quando o plano foge do controle? Como você se readapta sem perder a qualidade?"
> *Testa rigidez vs flexibilidade saudável.*

**VARIANTE B** (se respondeu flexível/intuitivo):
> "Você já perdeu um prazo importante por não ter planejado direito? O que aprendeu com isso?"
> *Testa se a flexibilidade é escolha ou falta de disciplina.*

**Sub-critérios:**
- `organizacao` — estruturação de tarefas e tempo
- `persistencia` — compromisso com entregas até o fim
- `atencao_a_detalhes` — qualidade e precisão no que faz

---

## 👥 EXTRAVERSION (Energia Social, Comunicação, Iniciativa em Grupo)

**PERGUNTA TOPO:**
> "Pensa num projeto novo que vai começar. Você prefere alinhar tudo pessoalmente com o time ou estudar o escopo sozinho e depois compartilhar?"
> *Contextualiza, não pergunta "você é tímido?".*

**VARIANTE A** (se respondeu social/colaborativo):
> "E quando você precisa de concentração profunda? Consegue manter o foco mesmo num ambiente movimentado?"
> *Testa se extraversão é saudável ou dependência de estímulo.*

**VARIANTE B** (se respondeu independente/reservado):
> "Você sente que às vezes sua contribuição se perde por não se expor mais nas discussões?"
> *Testa se o isolamento é preferência ou limitação.*

**Sub-critérios:**
- `sociabilidade` — prazer em interações
- `energia_social` — recarga sozinho vs em grupo
- `assertividade` — iniciativa em discussões

---

## 🤝 AGREEABLENESS (Cooperação, Empatia, Estilo de Conflito)

**PERGUNTA TOPO:**
> "Você está num projeto e alguém do time entrega algo muito abaixo do combinado. Qual sua abordagem?"
> *Situação realista. Revela estilo de conflito.*

**VARIANTE A** (se respondeu acolhedor/diplomático):
> "E quando o feedback não é bem recebido? Você insiste ou deixa pra lá pra preservar o clima?"
> *Testa se a harmonia vem de coragem ou de evitar confronto.*

**VARIANTE B** (se respondeu direto/confrontador):
> "Você já foi visto como 'difícil' por ser muito direto? Como lidou com isso?"
> *Testa se a franqueza é consciente ou arrogância.*

**Sub-critérios:**
- `cooperacao` — trabalho em equipe e colaboração
- `empatia` — capacidade de entender o outro
- `estilo_conflito` — equilíbrio entre franqueza e tato

---

## 🧠 NEUROTICISM (Estabilidade Emocional, Resiliência, Estresse)

**PERGUNTA TOPO:**
> "Lembra da última vez que algo deu muito errado num momento crítico. O que passou pela sua cabeça na hora? E depois?"
> *Busca exemplo real, não abstrato.*

**VARIANTE A** (se respondeu calmo/resiliente):
> "E quando a pressão se acumula por semanas seguidas? Você sente o peso ou mantém o mesmo ritmo?"
> *Testa resiliência genuína vs negação.*

**VARIANTE B** (se respondeu ansioso/afetado):
> "O que você faz pra recarregar depois desses momentos? Tem alguma estratégia que te ajuda?"
> *Testa autoconhecimento e gestão emocional.*

**Sub-critérios:**
- `ansiedade` — propensão a preocupação
- `instabilidade_emocional` — oscilações de humor
- `reatividade_estresse` — como reage sob pressão real

---

## 📐 Estrutura de Scoring

```
Para cada dimensão:
  3 sub-critérios × coletados ao longo de 2-3 interações
  → Média aritmética simples
  → Exibido como inteiro (ex: 63%, não 62.5%)

Exemplo real:
  Conscientiousness:
    organização:      0.82
    persistencia:     0.74  
    atencao_detalhes: 0.79
    ───────────────────
    FINAL:            0.783 → 78%
```

**Total de interações:** 5 tops + 10 variantes = **15 mínimo**, mas o LLM pode estender se achar que precisa de mais dados em alguma dimensão.

**Cada pergunta é gerada pelo LLM com base no guideline, não lida de um script.** Isso garante que a formulação nunca se repita entre candidatos.
