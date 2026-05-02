import Link from "next/link"

const OCEAN_DIMS = [
  { letter: "O", name: "Abertura", desc: "Criatividade e curiosidade" },
  { letter: "C", name: "Conscienciosidade", desc: "Organização e responsabilidade" },
  { letter: "E", name: "Extroversão", desc: "Sociabilidade e energia" },
  { letter: "A", name: "Amabilidade", desc: "Cooperação e empatia" },
  { letter: "N", name: "Neuroticismo", desc: "Estabilidade emocional" },
]

const STEPS = [
  { num: "01", title: "Candidato responde", desc: "Questionário OCEAN de 30 perguntas em formato conversacional. Leva 5 minutos." },
  { num: "02", title: "Match por valores", desc: "Nossa IA compara o perfil do candidato com a cultura da empresa." },
  { num: "03", title: "Contratação precisa", desc: "Empresas encontram talentos alinhados aos seus valores. Menos turnover." },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold tracking-tight">Whyme</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Entrar</Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Recrutamento por{" "}
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">valores</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          O Whyme usa o modelo OCEAN para conectar candidatos e empresas pelo que realmente importa: 
          alinhamento de perfil e cultura. Menos currículo, mais compatibilidade.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Começar agora
          </Link>
          <Link
            href="/faq"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500"
          >
            Saber mais
          </Link>
        </div>
      </section>

      {/* OCEAN explanation */}
      <section className="border-t border-zinc-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">O que é OCEAN?</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
            O modelo dos 5 grandes fatores da personalidade, validado por décadas de pesquisa acadêmica.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {OCEAN_DIMS.map((dim) => (
              <div key={dim.letter} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400">
                  {dim.letter}
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">{dim.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{dim.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
            Três passos simples para encontrar o match ideal.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <span className="text-3xl font-bold text-blue-500/30">{step.num}</span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Pronto para encontrar o match ideal?</h2>
          <p className="mt-4 text-zinc-400">
            Junte-se às empresas que já estão revolucionando seu processo seletivo.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Criar conta gratuita
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <span className="text-sm text-zinc-600">Whyme © 2026</span>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacidade</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Termos</Link>
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
