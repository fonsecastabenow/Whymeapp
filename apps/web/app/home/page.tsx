'use client'

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const OCEAN_DIMS = [
  { letter: "O", name: "Abertura", desc: "Criatividade e curiosidade intelectual" },
  { letter: "C", name: "Consciência", desc: "Organização e responsabilidade" },
  { letter: "E", name: "Extroversão", desc: "Sociabilidade e energia" },
  { letter: "A", name: "Amabilidade", desc: "Cooperação e empatia" },
  { letter: "N", name: "Neuroticismo", desc: "Estabilidade emocional" },
]

const STEPS = [
  { num: "01", title: "Responda o questionário", desc: "30 perguntas em formato conversacional. Leva 5 minutos e revela seu perfil OCEAN completo." },
  { num: "02", title: "Match por valores", desc: "Nossa IA compara seu perfil com a cultura de cada empresa. Sem achismos, só ciência." },
  { num: "03", title: "Contratação precisa", desc: "Empresas encontram talentos alinhados. Candidatos encontram culturas compatíveis." },
]

const STATS = [
  { num: 5, suffix: " min", label: "Para o perfil" },
  { num: 95, suffix: "%", label: "Precisão" },
  { num: 3, suffix: "×", label: "Menos turnover" },
]

function useReveal<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function useCounter(target: number, active: boolean, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = (now: number) => {
      if (!start) start = now
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return val
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return y
}

function StatItem({ num, suffix, label, active }: { num: number; suffix: string; label: string; active: boolean }) {
  const count = useCounter(num, active)
  return (
    <div className="text-center">
      <div className="text-3xl font-black text-gradient-gold">{count}{suffix}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{label}</div>
    </div>
  )
}

export default function Home() {
  const scrollY = useScrollY()
  const [statsRef, statsVisible] = useReveal<HTMLDivElement>(0.5)
  const [oceanRef, oceanVisible] = useReveal<HTMLElement>()
  const [stepsRef, stepsVisible] = useReveal<HTMLElement>()
  const [ctaRef, ctaVisible] = useReveal<HTMLElement>()

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-[#3AB0FF]/10 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-black tracking-widest text-gradient-gold uppercase">WHY ME?</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-32 px-6">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div
          className="absolute top-1/4 left-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #3AB0FF, transparent 70%)",
            transform: `translateX(-50%) translateY(${scrollY * 0.25}px)`,
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3AB0FF]/25 bg-[#3AB0FF]/8 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3AB0FF] animate-pulse" />
            <span className="text-sm text-[#3AB0FF] font-medium tracking-wider uppercase">
              Powered by OCEAN Science
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
            Recrutamento por
            <br />
            <span className="text-gradient-gold">valores reais</span>
            <br />
            <span className="text-muted-foreground text-4xl md:text-5xl font-light">não por currículo</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            O WHY ME? usa o modelo psicológico OCEAN para conectar candidatos e empresas
            pelo que realmente importa: alinhamento de personalidade e cultura.
          </p>

          {/* CTAs */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-500 mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#3AB0FF]/25 transition-all hover:shadow-[#3AB0FF]/40 hover:opacity-90"
            >
              Começar agora
            </Link>
            <Link
              href="/faq"
              className="rounded-xl border border-[#3AB0FF]/25 px-8 py-3.5 text-base font-semibold text-[#3AB0FF] transition-colors hover:border-[#3AB0FF]/50 hover:bg-[#3AB0FF]/5"
            >
              Saber mais
            </Link>
          </div>

          {/* Stats */}
          <div
            ref={statsRef}
            className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-700 mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto"
          >
            {STATS.map((s) => (
              <StatItem key={s.label} num={s.num} suffix={s.suffix} label={s.label} active={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* OCEAN section */}
      <section ref={oceanRef} className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-700 ${oceanVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="text-sm text-[#3AB0FF] font-semibold tracking-widest uppercase">
              O Modelo
            </span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 tracking-tight">
              O que é <span className="text-gradient-gold">OCEAN?</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              5 grandes fatores da personalidade validados por décadas de pesquisa acadêmica.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {OCEAN_DIMS.map((dim, i) => (
              <div
                key={dim.letter}
                className={`glass-card rounded-2xl p-5 text-center hover:border-[#3AB0FF]/30 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 group ${oceanVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: oceanVisible ? `${i * 90}ms` : "0ms" }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3AB0FF]/10 group-hover:bg-[#3AB0FF]/20 transition-colors">
                  <span className="text-lg font-black text-[#3AB0FF]">{dim.letter}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{dim.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{dim.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef} className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-700 ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="text-sm text-[#3AB0FF] font-semibold tracking-widest uppercase">
              Processo
            </span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 tracking-tight">
              Como <span className="text-gradient-gold">funciona</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`glass-card rounded-2xl p-8 hover:border-[#3AB0FF]/25 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: stepsVisible ? `${i * 120}ms` : "0ms" }}
              >
                <span className="text-4xl font-black text-[#3AB0FF]/20">{step.num}</span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[2px] bg-gradient-to-r from-transparent via-[#3AB0FF] to-transparent opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] opacity-10"
          style={{ background: "radial-gradient(ellipse, #3AB0FF, transparent 70%)" }} />

        <div className={`mx-auto max-w-3xl text-center transition-all duration-700 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            Pronto para o
            <br />
            <span className="text-gradient-gold">match ideal?</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Junte-se a quem já está revolucionando o processo seletivo com personalidade.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#3AB0FF]/25 transition-all hover:opacity-90"
            >
              Criar conta gratuita
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[#3AB0FF]/25 px-8 py-3.5 text-base font-semibold text-[#3AB0FF] transition-colors hover:border-[#3AB0FF]/50"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#3AB0FF]/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row">
          <span className="text-sm text-muted-foreground/50">WHY ME? © 2026</span>
          <div className="flex gap-6 text-sm text-muted-foreground/50">
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacidade</Link>
            <Link href="/terms"   className="hover:text-muted-foreground transition-colors">Termos</Link>
            <Link href="/faq"     className="hover:text-muted-foreground transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
