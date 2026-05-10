/**
 * Right panel — DEPARTMENT detail view.
 * Shows for a specific dept × state:
 *   - 3 KPI index cards (value vs baseline: India avg)
 *   - Central schemes grid
 *   - State schemes grid
 *   - 24-month trend chart for active KPI
 */
import { ArrowLeft, TrendingUp, TrendingDown, Landmark, Building2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DeptDetailPanelProps {
  stateName: string;
  deptMeta: any;
  stateSnap: any;       // snapshot for this state/dept
  nationalSnap: any;    // national rollup for comparison
  history: any;         // 24-month history for this state/dept
  fundingState: any;    // funding for this state/dept
  onBack: () => void;
}

const fmt = (v: any, format: string): string => {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  if (format === "pct") return `${n.toFixed(1)}%`;
  if (format === "cr")  return `₹${n.toFixed(1)} Cr`;
  if (format === "dec") return n.toFixed(2);
  if (n >= 1_00_000) return `${(n/1_00_000).toFixed(2)} L`;
  if (n >= 1_000)   return Math.round(n).toLocaleString("en-IN");
  return n.toFixed(1);
};

function lookupPath(obj: any, path: string[] | undefined): any {
  if (!Array.isArray(path)) return undefined;
  let cur = obj;
  for (const p of path) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}

export function DeptDetailPanel({
  stateName, deptMeta, stateSnap, nationalSnap, history, fundingState, onBack,
}: DeptDetailPanelProps) {
  const accent = deptMeta?.accent ?? "#00D4AA";
  const kpis   = deptMeta?.kpis ?? [];

  const centralSchemes = deptMeta?.central_schemes ?? [];
  const stateSchemes   = stateName === "Gujarat" ? (deptMeta?.gj_schemes ?? []) : (deptMeta?.tn_schemes ?? []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3 shrink-0"
           style={{ background: `linear-gradient(180deg, ${accent}18 0%, rgba(13,24,33,0) 100%)`, borderTop: `3px solid ${accent}` }}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{stateName}</div>
          <div className="display text-xl font-black text-white leading-tight">{deptMeta?.name}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ── Main Indexes ─────────────────────────────────── */}
        <div>
          <SectionLabel color={accent} icon={<span>📊</span>} label="Main Indexes — vs India average" />
          <div className="grid grid-cols-3 gap-2.5 mt-2">
            {kpis.map((k: any) => {
              const sv = stateSnap?.kpis?.[k.code];
              const nv = nationalSnap?.kpis?.[k.code];
              const delta = (sv != null && nv != null) ? sv - nv : null;
              const better = delta == null ? null
                : (k.direction === "lower_is_better" ? delta < 0 : delta > 0);
              const DirIcon = better == null ? null : (k.direction === "lower_is_better" ? TrendingDown : TrendingUp);
              return (
                <div key={k.code} className="rounded-xl p-3 text-center"
                     style={{ background: "rgba(22,32,51,0.8)", border: `1px solid ${k.accent ?? accent}30` }}>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{k.short}</div>
                  <div className="fig display text-[22px] font-black" style={{ color: k.accent ?? accent }}>
                    {Number.isFinite(sv) ? sv.toFixed(1) : "—"}
                  </div>
                  <div className="text-[8.5px] text-white/25 mb-1">{k.unit}</div>
                  {delta != null && (
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold"
                         style={{ color: better ? "#00D4AA" : "#FF5757" }}>
                      {DirIcon && <DirIcon size={10} strokeWidth={3} />}
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs avg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── UCF Funding ──────────────────────────────────── */}
        {fundingState && (
          <div>
            <SectionLabel color={accent} icon={<span>💰</span>} label="UCF Fund · FY 2026-27" />
            <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(22,32,51,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-[9px] text-white/30 uppercase">Central (60%)</div>
                  <div className="fig text-[16px] font-bold" style={{ color: "#FF7722" }}>
                    ₹{(fundingState.central/1000).toFixed(1)}k Cr
                  </div>
                  <div className="text-[9px] text-white/30">{fundingState.central_release_pct?.toFixed(1)}% released</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/30 uppercase">State (40%)</div>
                  <div className="fig text-[16px] font-bold text-white">
                    ₹{(fundingState.state/1000).toFixed(1)}k Cr
                  </div>
                  <div className="text-[9px] text-white/30">{fundingState.state_release_pct?.toFixed(1)}% released</div>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                     style={{ width: `${Math.round(fundingState.total_released/Math.max(1,fundingState.total_allocated)*100)}%`,
                              background: `linear-gradient(90deg, #FF7722, ${accent})` }} />
              </div>
            </div>
          </div>
        )}

        {/* ── 24-month trend ───────────────────────────────── */}
        {history && kpis.length > 0 && (
          <div>
            <SectionLabel color={accent} icon={<span>📈</span>} label={`${kpis[0].name} · 24-month trend`} />
            <div className="mt-2 rounded-xl p-3" style={{ background: "rgba(22,32,51,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.months?.map((m: string, i: number) => ({ month: m, v: history.series?.[kpis[0].code]?.[i] }))}
                             margin={{ top:4, right:4, left:-16, bottom:0 }}>
                    <defs>
                      <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} tickLine={false} axisLine={false} width={28} />
                    <Tooltip contentStyle={{ background: "rgba(13,24,33,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={2} fill="url(#deptGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Central schemes ──────────────────────────────── */}
        {centralSchemes.length > 0 && (
          <div>
            <SectionLabel color="#FF7722" icon={<Landmark size={12} />} label="Central Government Schemes" />
            <div className="mt-2 space-y-2">
              {centralSchemes.map((s: any) => {
                const v = lookupPath(stateSnap?.schemes, s.value_path);
                return (
                  <SchemeRow key={s.code} scheme={s} value={v} accent={s.accent ?? "#FF7722"} tier="Central" />
                );
              })}
            </div>
          </div>
        )}

        {/* ── State schemes ─────────────────────────────────── */}
        {stateSchemes.length > 0 && (
          <div>
            <SectionLabel color="#00D4AA" icon={<Building2 size={12} />}
              label={`State Government Schemes · ${stateName === "Gujarat" ? "Gujarat" : "Tamil Nadu"}`} />
            <div className="mt-2 space-y-2">
              {stateSchemes.map((s: any) => {
                const v = lookupPath(stateSnap?.schemes, s.value_path);
                return (
                  <SchemeRow key={s.code} scheme={s} value={v} accent={s.accent ?? "#00D4AA"} tier="State" />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ color, icon, label }: { color: string; icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
         style={{ color }}>
      {icon}<span>{label}</span>
    </div>
  );
}

function SchemeRow({ scheme, value, accent, tier }: any) {
  const fmtd = fmt(value, scheme.format ?? "int");
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
         style={{ background: "rgba(22,32,51,0.7)", border: `1px solid ${accent}20` }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: tier === "Central" ? "#FF7722" : "#00D4AA",
                         background: tier === "Central" ? "rgba(255,119,34,0.15)" : "rgba(0,212,170,0.15)" }}>
            {tier}
          </span>
        </div>
        <div className="text-[12px] font-semibold text-white leading-tight">{scheme.name}</div>
        <div className="text-[10px] text-white/30 mt-0.5">{scheme.metric} · {scheme.unit}</div>
      </div>
      <div className="fig text-[16px] font-black shrink-0" style={{ color: accent }}>
        {fmtd}
      </div>
    </div>
  );
}
