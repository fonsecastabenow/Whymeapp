/* Main app: page shell, vaga hero, podium of top 3, pipeline list, drawer */
const { useState, useMemo, useEffect, useRef } = React;

// ─── Helpers ─────────────────────────────────────────────
function formatBRL(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function scoreColor(pct) {
  if (pct >= 85) return "#38d391";
  if (pct >= 70) return "#3AB0FF";
  if (pct >= 55) return "#f5b454";
  return "#f06b6b";
}

// ─── Score ring ─────────────────────────────────────────
function ScoreRing({ value, size = 76, stroke = 6, label = true, accentMode = "match" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(value * 100);
  const color = scoreColor(pct);
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      {label && (
        <div className="pct" style={{ color }}>
          {pct}<small>%</small>
        </div>
      )}
    </div>
  );
}

function avBg(c) { return `linear-gradient(135deg, ${c[0]}, ${c[1]})`; }

// ─── Sidebar ───────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark"></div>
        <div className="word">WHY ME?</div>
      </div>

      <div className="org">
        <div className="logo">MC</div>
        <div>
          <div className="name">Moove Cars</div>
          <div className="plan">Plano · Crescimento</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">Recrutamento</div>
        <a><Icon name="dashboard"/> Dashboard</a>
        <a className="active"><Icon name="briefcase"/> Vagas <span className="count">7</span></a>
        <a><Icon name="users"/> Candidatos <span className="count">412</span></a>
        <a><Icon name="match"/> Matches <span className="count">28</span></a>
        <a><Icon name="calendar"/> Entrevistas</a>

        <div className="nav-section">Empresa</div>
        <a><Icon name="building"/> Perfil & Cultura</a>
        <a><Icon name="team"/> Time</a>
        <a><Icon name="settings"/> Configurações</a>
      </nav>

      <div className="user-card">
        <div className="av">RD</div>
        <div>
          <div className="who">Rodrigo Diniz</div>
          <div className="role">Head of Talent · Admin</div>
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────
function Topbar({ onOpenTweaks }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        <span>Vagas</span>
        <span className="sep">/</span>
        <span>Engenheiro(a) Sênior</span>
        <span className="sep">/</span>
        <span className="here">Candidatos</span>
      </div>
      <div className="spacer" />
      <div className="search">
        <Icon name="search" size={14} />
        <input placeholder="Buscar candidatos…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="icon-btn" title="Notificações"><Icon name="bell" size={16} /><span className="dot" /></button>
      <button className="icon-btn" title="Compartilhar"><Icon name="share" size={16} /></button>
    </div>
  );
}

// ─── Vaga hero ─────────────────────────────────────────
function VagaHero({ vaga, oceanViz }) {
  const Viz = window[oceanViz === "orbital" ? "OrbitalViz" : oceanViz === "radar" ? "RadarViz" : "ConstellationViz"];
  return (
    <div className="job-hero">
      <div className="row">
        <div style={{ minWidth: 0, flex: "1 1 420px" }}>
          <div className="head">
            <div className="co-logo">{vaga.companyShort}</div>
            <div>
              <h1>{vaga.title}</h1>
              <div className="meta">
                <span className="item"><Icon name="building" size={13}/> {vaga.company}</span>
                <span className="dot"></span>
                <span className="item">{vaga.squad}</span>
                <span className="dot"></span>
                <span className="item"><Icon name="pin" size={13}/> {vaga.city}</span>
                <span className="dot"></span>
                <span className="item">{vaga.workModel}</span>
                <span className="dot"></span>
                <span className="item">{vaga.contract}</span>
              </div>
            </div>
          </div>
          <p style={{ color: "var(--fg-2)", fontSize: 13.5, lineHeight: 1.55, margin: "16px 0 12px", maxWidth: 680 }}>
            {vaga.description}
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {vaga.hardSkills.map((s) => <span key={s} className="chip primary">{s}</span>)}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {vaga.softSkills.map((s) => <span key={s} className="chip violet">{s}</span>)}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn primary"><Icon name="plus" size={14}/> Convidar candidato</button>
            <button className="btn ghost"><Icon name="edit" size={14}/> Editar vaga</button>
            <button className="btn subtle"><Icon name="copy" size={14}/> Compartilhar link</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end" }}>
          <div style={{
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 14,
            background: "var(--surface-3)",
          }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 6 }}>
              Perfil OCEAN da vaga
            </div>
            <Viz scores={vaga.ocean} size={oceanViz === "constellation" ? 280 : 220} animated={false} />
          </div>

          <div className="stats">
            <div className="stat">
              <div className="k">Candidatos</div>
              <div className="v">{vaga.stats.candidates}</div>
              <div className="delta">+12 esta semana</div>
            </div>
            <div className="stat">
              <div className="k">Match recíproco</div>
              <div className="v" style={{ color: "#DDD0FF" }}>{vaga.stats.bilateral}</div>
              <div className="delta">+3</div>
            </div>
            <div className="stat">
              <div className="k">Em entrevista</div>
              <div className="v">{vaga.stats.interviewed}</div>
              <div className="delta">2 hoje</div>
            </div>
            <div className="stat">
              <div className="k">Match médio</div>
              <div className="v">{vaga.stats.avgMatch}<small>%</small></div>
              <div className="delta">+4</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter bar ────────────────────────────────────────
function FilterBar({ stage, setStage, sort, setSort, density, setDensity, total, count }) {
  const stages = [
    { id: "all", label: "Todos" },
    { id: "new", label: "Novos" },
    { id: "contacted", label: "Contatados" },
    { id: "interview", label: "Entrevista" },
    { id: "advanced", label: "Avançados" },
  ];
  return (
    <div className="filter-bar">
      <div className="seg">
        {stages.map((s) => (
          <button key={s.id} className={stage === s.id ? "on" : ""} onClick={() => setStage(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <button className="sort-pill"><Icon name="filter" size={12}/> Filtros (3) </button>
      <button className="sort-pill"><Icon name="bilateral" size={12}/> Apenas recíprocos</button>
      <span className="count" style={{ marginLeft: 8 }}>
        Mostrando <b>{count}</b> de <b>{total}</b> candidatos
      </span>
      <div className="right">
        <button className="sort-pill" onClick={() => setSort(sort === "score" ? "recent" : "score")}>
          <Icon name="sort" size={12}/> {sort === "score" ? "Match (alto → baixo)" : "Mais recentes"}
        </button>
        <div className="seg">
          <button className={density === "spacious" ? "on" : ""} onClick={() => setDensity("spacious")}>
            <Icon name="grid" size={12}/>
          </button>
          <button className={density === "compact" ? "on" : ""} onClick={() => setDensity("compact")}>
            <Icon name="rows" size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate card (podium) ──────────────────────────
function CandidateCard({ rank, c, vaga, oceanViz, onOpen, saved, onSave }) {
  return (
    <div className="candidate-card fade-in" onClick={() => onOpen(c.id)}>
      <div className="rank-tag">
        <span className="num">#{String(rank).padStart(2, "0")}</span>
        <span>Top match</span>
      </div>
      <button className={`save ${saved ? "on" : ""}`}
        onClick={(e) => { e.stopPropagation(); onSave(c.id); }}
        title={saved ? "Salvo" : "Salvar"}>
        <Icon name={saved ? "starFill" : "star"} size={14} />
      </button>

      <div className="body">
        <div className="who-row">
          <div className="av-lg" style={{ background: avBg(c.photoColor) }}>{c.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="name">{c.name}</div>
            <div className="headline">{c.headline}</div>
            <div className="loc"><Icon name="pin" size={11}/> {c.location} · {c.available}</div>
          </div>
          <ScoreRing value={c.score} />
        </div>

        <div className="tag-row">
          {c.bilateral && (
            <span className="bilateral"><span className="pulse"/> Match recíproco</span>
          )}
          <span className={`status-pill ${c.status}`}>
            <span className="d"/> {window.STATUS_LABELS[c.status]}
          </span>
        </div>

        <div className="skill-row">
          {c.skills.slice(0, 5).map((s) => <span key={s} className="skill">{s}</span>)}
        </div>

        {oceanViz === "bars" ? (
          <window.MiniBars scores={c.ocean} target={vaga.ocean} band={vaga.oceanBand} />
        ) : oceanViz === "constellation" ? (
          <window.ConstellationViz scores={c.ocean} target={vaga.ocean} size={250} />
        ) : oceanViz === "radar" ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <window.RadarViz scores={c.ocean} target={vaga.ocean} size={180} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <window.OrbitalViz scores={c.ocean} target={vaga.ocean} size={200} />
          </div>
        )}

        <div className="footer">
          <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
            <Icon name="bag" size={11}/> {formatBRL(c.salary)}
          </span>
          <div className="actions">
            <button className="btn subtle" onClick={(e) => { e.stopPropagation(); onOpen(c.id); }}>Ver perfil</button>
            <button className="btn primary" onClick={(e) => e.stopPropagation()}>Convidar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline row ──────────────────────────────────────
function PipelineRow({ rank, c, onOpen }) {
  const pct = Math.round(c.score * 100);
  return (
    <div className="row" onClick={() => onOpen(c.id)}>
      <div className="rank">#{String(rank).padStart(2, "0")}</div>
      <div className="who">
        <div className="av-sm" style={{ background: avBg(c.photoColor) }}>{c.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="name">{c.name}</div>
          <div className="headline">{c.headline} · {c.location}</div>
        </div>
        {c.bilateral && (
          <span className="bilateral" style={{ marginLeft: 6 }}><span className="pulse"/> Recíproco</span>
        )}
      </div>
      <div className="skills">
        {c.skills.slice(0, 4).map((s) => <span key={s} className="skill">{s}</span>)}
      </div>
      <window.OceanStrip scores={c.ocean} />
      <div className="score-cell">
        <span className="pct" style={{ color: scoreColor(pct) }}>{pct}<small style={{ fontSize: 10, color: "var(--fg-3)" }}>%</small></span>
        <span className="bar">
          <span className="fill" style={{ width: `${pct}%`, background: scoreColor(pct) }} />
        </span>
      </div>
      <span className={`status-pill ${c.status}`}><span className="d"/> {window.STATUS_LABELS[c.status]}</span>
      <button className="icon-btn" onClick={(e) => e.stopPropagation()} title="Mais"><Icon name="more" size={14}/></button>
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────
function Drawer({ open, candidate, vaga, oceanViz, onClose, onAction }) {
  if (!candidate) return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`drawer ${open ? "open" : ""}`} />
    </>
  );

  const c = candidate;
  const Viz = oceanViz === "orbital" ? window.OrbitalViz
    : oceanViz === "radar" ? window.RadarViz
    : window.ConstellationViz;
  const compatScore = Math.round(c.score * 100);
  const cosine = (Math.sqrt(c.score) * 0.96).toFixed(3);

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="x" onClick={onClose} aria-label="Fechar">
          <Icon name="x" size={16}/>
        </button>

        <div className="head">
          <div className="top">
            <div className="av-lg" style={{ background: avBg(c.photoColor) }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="name">{c.name}</div>
              <div className="headline">{c.headline}</div>
              <div className="loc">
                <span><Icon name="pin" size={11}/> {c.location}</span>
                <span>·</span>
                <span><Icon name="bag" size={11}/> {formatBRL(c.salary)}</span>
                <span>·</span>
                <span>{c.workModel}</span>
                <span>·</span>
                <span>{c.available}</span>
              </div>
            </div>
            <ScoreRing value={c.score} size={88} stroke={7} />
          </div>

          <div className="meta-row">
            {c.bilateral && (
              <span className="bilateral"><span className="pulse"/> Match recíproco · ela também priorizou esta vaga</span>
            )}
            <span className={`status-pill ${c.status}`}><span className="d"/> {window.STATUS_LABELS[c.status]}</span>
          </div>
        </div>

        <div className="body">
          <section>
            <h3>Resumo do match</h3>
            <p style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>
              {c.summary}
            </p>
            <div className="match-summary">
              <div className="box">
                <div className="k">Compatibilidade</div>
                <div className="v" style={{ color: scoreColor(compatScore) }}>
                  {compatScore}<small>%</small>
                </div>
                <div className="desc">Cosseno OCEAN ponderado: {cosine}</div>
              </div>
              <div className="box">
                <div className="k">Hard skills · cobertura</div>
                <div className="v" style={{ color: "#3AB0FF" }}>
                  {Math.min(c.skills.length, vaga.hardSkills.length)}<small>/{vaga.hardSkills.length}</small>
                </div>
                <div className="desc">
                  Faltam: {vaga.hardSkills.filter((s) => !c.skills.includes(s)).slice(0, 2).join(", ") || "nenhum"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3>Perfil OCEAN vs. vaga</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: 18,
              alignItems: "center",
            }}>
              <div style={{
                border: "1px solid var(--line)",
                borderRadius: 16, padding: 12,
                background: "var(--surface-3)",
                display: "grid", placeItems: "center"
              }}>
                <Viz scores={c.ocean} target={vaga.ocean} size={oceanViz === "constellation" ? 240 : 220} />
                <div style={{ display: "flex", gap: 12, fontSize: 11, marginTop: 8, color: "var(--fg-3)" }}>
                  <span><span style={{
                    display: "inline-block", width: 10, height: 2, background: "#3AB0FF",
                    verticalAlign: "middle", marginRight: 4 }}/>Candidata</span>
                  <span><span style={{
                    display: "inline-block", width: 10, borderTop: "1px dashed rgba(255,255,255,0.5)",
                    verticalAlign: "middle", marginRight: 4 }}/>Vaga</span>
                </div>
              </div>
              <window.CompatBars scores={c.ocean} target={vaga.ocean} band={vaga.oceanBand} />
            </div>
          </section>

          <section>
            <h3>Hard skills</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {vaga.hardSkills.map((s) => {
                const has = c.skills.includes(s);
                return (
                  <span key={s} className="chip" style={{
                    borderColor: has ? "rgba(56,211,145,0.35)" : "var(--line)",
                    background: has ? "rgba(56,211,145,0.10)" : "var(--surface-3)",
                    color: has ? "#b6e8d2" : "var(--fg-3)",
                  }}>
                    {has ? "✓" : "·"} {s}
                  </span>
                );
              })}
              {c.skills.filter((s) => !vaga.hardSkills.includes(s)).map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
          </section>

          <section>
            <h3>Detalhes</h3>
            <div className="kv">
              <div className="k">Modalidade</div><div className="v">{c.workModel}</div>
              <div className="k">Pretensão</div><div className="v">{formatBRL(c.salary)}</div>
              <div className="k">Disponibilidade</div><div className="v">{c.available}</div>
              <div className="k">Formação</div><div className="v">{c.education.level} · {c.education.course} · {c.education.institution}</div>
              <div className="k">Idiomas</div>
              <div className="v">
                {c.languages.map(([l, lvl], i) => (
                  <span key={i} style={{ marginRight: 10 }}>{l} <span style={{ color: "var(--fg-3)" }}>({lvl})</span></span>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3>Linha do tempo</h3>
            <div className="timeline">
              {c.timeline.map((e, i) => (
                <div key={i} className={`ev ${e.done ? "done" : ""}`}>
                  <div className="when">{e.when}</div>
                  <div className="what">{e.what}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="actions-bar">
          <button className="btn subtle" onClick={() => onAction("decline", c)}><Icon name="x" size={13}/> Recusar</button>
          <div className="spacer" />
          <button className="btn ghost" onClick={() => onAction("message", c)}><Icon name="chat" size={13}/> Mensagem</button>
          <button className="btn primary" onClick={() => onAction("interview", c)}>
            <Icon name="calendar" size={13}/> Convidar p/ entrevista
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────
function Toast({ msg }) {
  return <div className={`toast ${msg ? "show" : ""}`}><span className="ic"><Icon name="check" size={14}/></span>{msg}</div>;
}

// ─── Page root ────────────────────────────────────────
function App() {
  // tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "oceanViz": "orbital",
    "podiumViz": "bars",
    "density": "spacious",
    "accent": "#3AB0FF",
    "showBands": true
  }/*EDITMODE-END*/;
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // accent palette swap
  useEffect(() => {
    const root = document.documentElement;
    const palettes = {
      "#3AB0FF": { primary: "#3AB0FF", primary2: "#1a8fdb", soft: "rgba(58,176,255,0.10)", line: "rgba(58,176,255,0.12)", lineStrong: "rgba(58,176,255,0.22)" },
      "#A78BFA": { primary: "#A78BFA", primary2: "#7C3AED", soft: "rgba(167,139,250,0.10)", line: "rgba(167,139,250,0.14)", lineStrong: "rgba(167,139,250,0.28)" },
      "#34D399": { primary: "#34D399", primary2: "#0F9C6F", soft: "rgba(52,211,153,0.10)", line: "rgba(52,211,153,0.14)", lineStrong: "rgba(52,211,153,0.28)" },
    };
    const p = palettes[t.accent] || palettes["#3AB0FF"];
    root.style.setProperty("--primary", p.primary);
    root.style.setProperty("--primary-2", p.primary2);
    root.style.setProperty("--primary-soft", p.soft);
    root.style.setProperty("--line", p.line);
    root.style.setProperty("--line-strong", p.lineStrong);
  }, [t.accent]);

  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState("score");
  const [openId, setOpenId] = useState(null);
  const [savedSet, setSavedSet] = useState(new Set(["c_002"]));
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (m) => {
    setToastMsg(m);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToastMsg(""), 2200);
  };

  const filtered = useMemo(() => {
    let list = window.CANDIDATES.slice();
    if (stage !== "all") list = list.filter((c) => c.status === stage);
    if (sort === "score") list.sort((a, b) => b.score - a.score);
    return list;
  }, [stage, sort]);

  const podium = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const candidate = openId ? window.CANDIDATES.find((c) => c.id === openId) : null;

  const onOpen = (id) => setOpenId(id);
  const onClose = () => setOpenId(null);
  const onSave = (id) => {
    setSavedSet((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); showToast("Removido dos salvos"); }
      else { n.add(id); showToast("Candidato salvo"); }
      return n;
    });
  };
  const onAction = (kind, c) => {
    onClose();
    if (kind === "interview") showToast(`Convite enviado para ${c.name.split(" ")[0]}`);
    else if (kind === "message") showToast(`Conversa aberta com ${c.name.split(" ")[0]}`);
    else if (kind === "decline") showToast(`${c.name.split(" ")[0]} movido para recusados`);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          <VagaHero vaga={window.VAGA} oceanViz={t.oceanViz} />

          <FilterBar
            stage={stage} setStage={setStage}
            sort={sort} setSort={setSort}
            density={t.density} setDensity={(d) => setTweak("density", d)}
            total={window.CANDIDATES.length}
            count={filtered.length}
          />

          {podium.length > 0 && (
            <>
              <div className="podium-label">
                <span>Top 3 · maior afinidade OCEAN</span>
                <span className="line" />
              </div>
              <div className="podium">
                {podium.map((c, i) => (
                  <CandidateCard key={c.id}
                    rank={i + 1} c={c} vaga={window.VAGA}
                    oceanViz={t.podiumViz}
                    onOpen={onOpen}
                    saved={savedSet.has(c.id)}
                    onSave={onSave}
                  />
                ))}
              </div>
            </>
          )}

          {rest.length > 0 && (
            <>
              <div className="pipeline-head">
                <h2>Pipeline · todos os candidatos</h2>
                <span className="line" />
              </div>
              <div className="pipeline">
                <div className="header-row">
                  <div></div>
                  <div>Candidato</div>
                  <div>Skills</div>
                  <div>Perfil OCEAN</div>
                  <div>Match</div>
                  <div>Status</div>
                  <div></div>
                </div>
                {rest.map((c, i) => (
                  <PipelineRow key={c.id} rank={i + 4} c={c} onOpen={onOpen} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="empty-soft">Nenhum candidato neste estágio.</div>
          )}

          <div className="divider" />
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", textAlign: "center", paddingBottom: 28 }}>
            WHY ME? · v0.9.0 · Compatibilidade calculada via cosseno OCEAN ponderado · LGPD compliant
          </div>
        </div>
      </main>

      <Drawer
        open={!!openId}
        candidate={candidate}
        vaga={window.VAGA}
        oceanViz={t.oceanViz}
        onClose={onClose}
        onAction={onAction}
      />

      <Toast msg={toastMsg} />

      {/* Tweaks */}
      <window.TweaksRoot tweaks={t} setTweak={setTweak} />
    </div>
  );
}

window.App = App;
