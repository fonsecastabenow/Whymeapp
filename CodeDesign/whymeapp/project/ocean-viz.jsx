/* OCEAN visualizations: Orbital, Radar, Bars, Constellation */
const { useEffect, useRef, useState, useMemo } = React;

// Orbital — animated rings + planets per OCEAN dimension. Size determines viewBox.
function OrbitalViz({ scores, target, size = 280, animated = true }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.40;
  const dims = window.OCEAN_KEYS;
  const angles = dims.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);

  const [t, setT] = useState(animated ? 0 : 1);
  useEffect(() => {
    if (!animated) { setT(1); return; }
    let raf, start;
    const tick = (now) => {
      if (!start) start = now;
      const e = Math.min(1, (now - start) / 700);
      setT(1 - Math.pow(1 - e, 3));
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scores, animated]);

  const pt = (a, r) => ({ x: cx + R * r * Math.cos(a), y: cy + R * r * Math.sin(a) });

  const scorePts = dims.map((k, i) => {
    const v = (scores[k] ?? 0) * t;
    return pt(angles[i], v);
  });
  const targetPts = target ? dims.map((k, i) => pt(angles[i], target[k] ?? 0)) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#3AB0FF" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="orbStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3AB0FF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={R * r}
          fill="none" stroke={r === 1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"} strokeWidth="1" />
      ))}

      {/* Axes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(a, 1).x} y2={pt(a, 1).y}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 4" />
      ))}

      {/* Target zone (if given) */}
      {targetPts && (
        <polygon
          points={targetPts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {/* Score polygon */}
      <polygon
        points={scorePts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="url(#orbGrad)"
        stroke="url(#orbStroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Planets */}
      {dims.map((k, i) => {
        const p = scorePts[i];
        const color = window.OCEAN_COLORS[k];
        return (
          <g key={k}>
            <circle cx={p.x} cy={p.y} r="6" fill={color} stroke="#0B1F3A" strokeWidth="1.5" />
            <circle cx={p.x} cy={p.y} r="11" fill={color} opacity="0.18" />
          </g>
        );
      })}

      {/* Labels */}
      {dims.map((k, i) => {
        const p = pt(angles[i], 1.18);
        return (
          <text key={k} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="800" fontFamily="ui-monospace, SF Mono, monospace"
            fill={window.OCEAN_COLORS[k]} opacity="0.85">
            {k}
          </text>
        );
      })}
    </svg>
  );
}

// Radar — classic pentagon (close to existing OceanRadar component)
function RadarViz({ scores, target, size = 260 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.36;
  const dims = window.OCEAN_KEYS;
  const angles = dims.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  const pt = (a, r) => ({ x: cx + R * r * Math.cos(a), y: cy + R * r * Math.sin(a) });
  const scorePts = dims.map((k, i) => pt(angles[i], scores[k] ?? 0));
  const targetPts = target ? dims.map((k, i) => pt(angles[i], target[k] ?? 0)) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r}
          points={angles.map((a) => `${pt(a, r).x},${pt(a, r).y}`).join(" ")}
          fill="none" stroke={r === 1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"} strokeWidth="1" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(a, 1).x} y2={pt(a, 1).y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {targetPts && (
        <polygon points={targetPts.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeDasharray="3 3" />
      )}
      <polygon
        points={scorePts.map(p => `${p.x},${p.y}`).join(" ")}
        fill="rgba(58,176,255,0.22)" stroke="#3AB0FF" strokeWidth="2" strokeLinejoin="round" />
      {scorePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={window.OCEAN_COLORS[dims[i]]} strokeWidth="2" />
      ))}
      {dims.map((k, i) => {
        const p = pt(angles[i], 1.18);
        return (
          <text key={k} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="700" fontFamily="ui-monospace, SF Mono, monospace"
            fill="rgba(255,255,255,0.7)">{k}</text>
        );
      })}
    </svg>
  );
}

// Inline tiny bars (used in candidate cards)
function MiniBars({ scores, target, band = 0.18 }) {
  const dims = window.OCEAN_KEYS;
  return (
    <div className="ocean-mini">
      {dims.map((k) => {
        const v = scores[k] ?? 0;
        const t = target ? (target[k] ?? 0) : null;
        const color = window.OCEAN_COLORS[k];
        return (
          <div key={k} className="row">
            <span className="lbl" style={{ color }}>{k}</span>
            <span className="track">
              <span className="fill" style={{ width: `${v * 100}%`, background: color, opacity: 0.85 }} />
              {t != null && (
                <>
                  <span className="target" style={{
                    left: `${Math.max(0, (t - band/2) * 100)}%`,
                    width: `${Math.min(100, band * 100)}%`,
                    background: "rgba(255,255,255,0.10)",
                  }}/>
                  <span className="target" style={{ left: `calc(${t * 100}% - 1px)` }} />
                </>
              )}
            </span>
            <span className="v">{Math.round(v * 100)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Constellation — the most novel one. Each dimension is a glowing planet on an arc.
function ConstellationViz({ scores, target, size = 280, animated = true }) {
  const w = size;
  const h = size * 0.72;
  const baseY = h - 12;
  const dims = window.OCEAN_KEYS;
  const colW = (w - 40) / dims.length;

  const [t, setT] = useState(animated ? 0 : 1);
  useEffect(() => {
    if (!animated) { setT(1); return; }
    let raf, start;
    const tick = (now) => {
      if (!start) start = now;
      const e = Math.min(1, (now - start) / 800);
      setT(1 - Math.pow(1 - e, 3));
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scores, animated]);

  const points = dims.map((k, i) => {
    const v = (scores[k] ?? 0) * t;
    const x = 20 + colW * (i + 0.5);
    const y = baseY - v * (baseY - 24);
    return { x, y, k, v };
  });

  // smooth path through points
  const path = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = arr[i-1];
    const mx = (prev.x + p.x) / 2;
    return `${acc} C${mx},${prev.y} ${mx},${p.y} ${p.x},${p.y}`;
  }, "");

  const targetPts = target ? dims.map((k, i) => {
    const x = 20 + colW * (i + 0.5);
    const y = baseY - (target[k] ?? 0) * (baseY - 24);
    return { x, y };
  }) : null;

  return (
    <svg width={size} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="constLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#3AB0FF" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Horizon lines */}
      {[0.25, 0.5, 0.75].map((r) => (
        <line key={r} x1="20" x2={w - 20}
          y1={baseY - r * (baseY - 24)} y2={baseY - r * (baseY - 24)}
          stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
      ))}
      <line x1="20" x2={w - 20} y1={baseY} y2={baseY} stroke="rgba(255,255,255,0.18)" />

      {/* Target ribbon */}
      {targetPts && (
        <polyline
          points={targetPts.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.32)"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />
      )}

      {/* Score curve */}
      <path d={path} fill="none" stroke="url(#constLine)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Connectors to baseline */}
      {points.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y + 8} x2={p.x} y2={baseY}
          stroke={window.OCEAN_COLORS[p.k]} strokeOpacity="0.18" strokeDasharray="1 3" />
      ))}

      {/* Planets */}
      {points.map((p, i) => {
        const color = window.OCEAN_COLORS[p.k];
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="11" fill={color} opacity="0.18" />
            <circle cx={p.x} cy={p.y} r="5.5" fill={color} stroke="#0B1F3A" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* Dimension labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={baseY + 16}
          textAnchor="middle" fontSize="10.5" fontWeight="800"
          fontFamily="ui-monospace, SF Mono, monospace"
          fill={window.OCEAN_COLORS[p.k]} opacity="0.9">
          {p.k}
        </text>
      ))}
    </svg>
  );
}

// Strip used inline in pipeline rows
function OceanStrip({ scores }) {
  const dims = window.OCEAN_KEYS;
  return (
    <div className="ocean-strip">
      {dims.map((k) => {
        const v = scores[k] ?? 0;
        const color = window.OCEAN_COLORS[k];
        return (
          <div key={k} className="seg">
            <div className="fill" style={{ height: `${v * 100}%`, background: color, opacity: 0.78 }} />
            <div className="lbl">{k}</div>
          </div>
        );
      })}
    </div>
  );
}

// Compatibility bars (drawer): show candidate value, target window, and delta
function CompatBars({ scores, target, band = 0.18 }) {
  const dims = window.OCEAN_KEYS;
  return (
    <div className="compat-bars">
      {dims.map((k) => {
        const v = scores[k] ?? 0;
        const t = target[k] ?? 0;
        const color = window.OCEAN_COLORS[k];
        const delta = v - t;
        const cls = Math.abs(delta) <= band/2 ? "good" : Math.abs(delta) <= band ? "warn" : "bad";
        const sign = delta > 0 ? "+" : "";
        return (
          <div key={k} className="item">
            <div>
              <div className="dim" style={{ color }}>{k}</div>
            </div>
            <div>
              <div className="label">
                {window.OCEAN_LONG[k]}
                <span className="desc" style={{ marginLeft: 8 }}>· {window.OCEAN_DESCRIPTIONS[k]}</span>
              </div>
              <div className="track">
                <div className="target-zone" style={{
                  left: `${Math.max(0, (t - band/2) * 100)}%`,
                  width: `${Math.min(100, band * 100)}%`,
                }}/>
                <div className="you" style={{ left: `calc(${v * 100}% - 1px)` }} />
                <div style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  height: 4, width: `${v * 100}%`,
                  background: `linear-gradient(90deg, ${color}33, ${color}88)`,
                  borderRadius: 999,
                }}/>
              </div>
            </div>
            <div className={`delta ${cls}`}>{sign}{Math.round(delta * 100)}</div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  OrbitalViz, RadarViz, MiniBars, ConstellationViz, OceanStrip, CompatBars
});
