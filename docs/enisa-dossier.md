# Dossier ENISA — Relatório de Inovação

## Whyme — Recrutamento por Valores e Personalidade

### 1. Problema
Processos seletivos tradicionais focam em habilidades técnicas (hard skills) e experiência, ignorando o fit cultural e comportamental. Resultado: alta rotatividade, equipes desalinhadas, custos elevados de contratação.

### 2. Solução Proposta
Whyme é uma plataforma SaaS B2B que utiliza o modelo OCEAN (Big Five) para medir traços de personalidade de candidatos e compará-los com o perfil cultural ideal de cada empresa. O matching é feito por similaridade vetorial (cosine similarity) entre embeddings gerados por BERT-pt.

### 3. Inovação

#### 3.1 Técnica
- Processamento de Linguagem Natural (PLN): BERT-pt para gerar embeddings das respostas
- Matching vetorial: similaridade entre vetor do candidato e vetor da empresa via pgvector
- Fine-tuning: modelo pode ser refinado com dados reais dos pilotos

#### 3.2 Metodológica
- Questionário adaptado: 30 perguntas em pt-BR (BFI + IPIP), 6 por dimensão
- Scoring transparente: breakdown por dimensão OCEAN
- Acessibilidade: versões para PCDs e autistas (leitor de tela, linguagem simples)

### 4. Diferenciais Competitivos
| Aspecto | Whyme | Concorrentes |
|---------|-------|-------------|
| Foco em personalidade | Primário | Secundário |
| Ciência comportamental | OCEAN validado academicamente | Questionários proprietários |
| Transparência | Breakdown por dimensão | Score único opaco |
| Inclusão | Acessibilidade desde o MVP | Não contemplado |
| Mercado | Brasil (PT-BR nativo) | Sem adaptação local |

### 5. Impacto Potencial
- Redução de turnover em até 40%
- Economia média de R$ 15.000 por contratação mal-sucedida evitada
- Aumento de produtividade com alto fit cultural

### 6. Próximos Passos (Pós-MVP)
- API para integração com ATS existentes
- Fine-tuning avançado com dados reais
- Produto 2.0: mobilidade interna
- Expansão para outros países lusófonos
