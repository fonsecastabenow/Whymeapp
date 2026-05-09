/* Icons (inline SVG) + Tweaks panel root */

function Icon({ name, size = 16, color }) {
  const s = size;
  const stroke = color || "currentColor";
  const sw = 1.6;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search":     return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "bell":       return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case "share":      return <svg {...common}><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v14"/></svg>;
    case "plus":       return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "edit":       return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "copy":       return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case "x":          return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "check":      return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case "chat":       return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "calendar":   return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case "pin":        return <svg {...common}><path d="M12 22s7-7.75 7-13a7 7 0 1 0-14 0c0 5.25 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case "bag":        return <svg {...common}><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>;
    case "more":       return <svg {...common}><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></svg>;
    case "filter":     return <svg {...common}><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>;
    case "sort":       return <svg {...common}><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 6v14"/></svg>;
    case "grid":       return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "rows":       return <svg {...common}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "star":       return <svg {...common}><polygon points="12 2 15.1 8.6 22 9.6 17 14.4 18.3 21.4 12 18 5.7 21.4 7 14.4 2 9.6 8.9 8.6 12 2"/></svg>;
    case "starFill":   return <svg width={s} height={s} viewBox="0 0 24 24" fill={stroke}><polygon points="12 2 15.1 8.6 22 9.6 17 14.4 18.3 21.4 12 18 5.7 21.4 7 14.4 2 9.6 8.9 8.6 12 2"/></svg>;
    case "dashboard":  return <svg {...common}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    case "briefcase":  return <svg {...common}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    case "users":      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13A4 4 0 0 1 16 11"/></svg>;
    case "match":      return <svg {...common}><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/></svg>;
    case "building":   return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M14 7h.01M9 12h.01M14 12h.01M9 17h.01M14 17h.01"/></svg>;
    case "team":       return <svg {...common}><path d="M16 11a4 4 0 1 0-8 0M2 21a8 8 0 0 1 20 0"/></svg>;
    case "settings":   return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "bilateral":  return <svg {...common}><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
    default: return null;
  }
}

window.Icon = Icon;

// ─── Tweaks root using starter components ────────────
function TweaksRoot({ tweaks, setTweak }) {
  const TP = window.TweaksPanel;
  const TS = window.TweakSection;
  const TR = window.TweakRadio;
  const TC = window.TweakColor;
  const TT = window.TweakToggle;

  if (!TP) return null;
  const TSel = window.TweakSelect;
  return (
    <TP title="Tweaks">
      <TS label="OCEAN — vaga & detalhe">
        <TR label="Estilo" value={tweaks.oceanViz}
          options={["orbital","radar","constellation"]}
          onChange={(v) => setTweak("oceanViz", v)} />
      </TS>
      <TS label="OCEAN — cards do podium">
        <TSel label="Estilo" value={tweaks.podiumViz}
          options={["bars","orbital","radar","constellation"]}
          onChange={(v) => setTweak("podiumViz", v)} />
      </TS>
      <TS label="Densidade">
        <TR label="Cards" value={tweaks.density}
          options={["spacious","compact"]}
          onChange={(v) => setTweak("density", v)} />
      </TS>
      <TS label="Acento">
        <TC label="Cor" value={tweaks.accent}
          options={["#3AB0FF","#A78BFA","#34D399"]}
          onChange={(v) => setTweak("accent", v)} />
      </TS>
    </TP>
  );
}

window.TweaksRoot = TweaksRoot;
