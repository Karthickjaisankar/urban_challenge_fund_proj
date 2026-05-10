/**
 * Right panel — DEPARTMENT detail view (light theme).
 */
import { ArrowLeft, TrendingUp, TrendingDown, Landmark, Building2, IndianRupee } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DeptDetailPanelProps {
  stateName: string;
  deptMeta: any;
  stateSnap: any;
  nationalSnap: any;
  history: any;
  fundingState: any;
  onBack: () => void;
}

const fmt = (v: any, format: string): string => {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  if (format === "pct") return `${n.toFixed(1)}%`;
  if (format === "cr")  return `₹${n.toFixed(1)} Cr`;
  if (format === "dec") return n.toFixed(2);
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)} L`;
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
  const accent       = deptMeta?.accent ?? "#3B82F6";
  const kpis         = deptMeta?.kpis ?? [];
  const centralSchemes = deptMeta?.central_schemes ?? [];
  const stateSchemes   = stateName === "Gujarat" ? (deptMeta?.gj_schemes ?? []) : (deptMeta?.tn_schemes ?? []);

  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0"
           style={{ borderTop: `3px solid ${accent}` }}>
        <div className="px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">{stateName}</div>
            <div className="display text-xl font-black text-slate-900 leading-tight">{deptMeta?.name}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* ── Main Indexes ────────────────────────────────── */}
        <div>
          <SectionLabel accent={accent} label="Main Indexes — vs India average" />
          <div className="grid grid-cols-3 gap-2.5 mt-2">
            {kpis.map((k: any) => {
              const sv = stateSnap?.kpis?.[k.code];
              const nv = nationalSnap?.kpis?.[k.code];
              const delta = (sv != null && nv != null) ? sv - nv : null;
              const better = delta == null ? null : (k.direction === "lower_is_better" ? delta < 0 : delta > 0);
              const DirIcon = better == null ? null : (k.direction === "lower_is_better" ? TrendingDown : TrendingUp);
              return (
                <div key={k.code} className="rounded-xl p-3 text-center bg-white border border-slate-100"
                     style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">{k.short}</div>
                  <div className="fig display text-[22px] font-black" style={{ color: k.accent ?? accent }}>
                    {Number.isFinite(sv) ? sv.toFixed(1) : "—"}
                  </div>
                  <div className="text-[8.5px] text-slate-400 mb-1">{k.unit}</div>
                  {delta != null && (
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold rounded px-1 py-0.5"
                         style={{ color: better ? "#15803D" : "#DC2626", background: better ? "#F0FDF4" : "#FEF2F2" }}>
                      {DirIcon && <DirIcon size={10} strokeWidth={3} />}
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs avg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── UCF Funding ─────────────────────────────────── */}
        {fundingState && (
          <div>
            <SectionLabel accent="#16A34A" label="UCF Fund · FY 2026-27" />
            <div className="mt-2 rounded-xl p-4 bg-white border border-slate-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="rounded-lg p-3 bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-1 text-[9px] text-orange-600 uppercase tracking-wider font-bold mb-1">
                    <IndianRupee size={10} />Central (60%)
                  </div>
                  <div className="fig text-[17px] font-black text-orange-700">
                    ₹{(fundingState.central / 1000).toFixed(1)}k Cr
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{fundingState.central_release_pct?.toFixed(1)}% released</div>
                </div>
                <div className="rounded-lg p-3 bg-green-50 border border-green-100">
                  <div className="flex items-center gap-1 text-[9px] text-green-700 uppercase tracking-wider font-bold mb-1">
                    <IndianRupee size={10} />State (40%)
                  </div>
                  <div className="fig text-[17px] font-black text-green-800">
                    ₹{(fundingState.state / 1000).toFixed(1)}k Cr
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{fundingState.state_release_pct?.toFixed(1)}% released</div>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                     style={{
                       width: `${Math.round(fundingState.total_released / Math.max(1, fundingState.total_allocated) * 100)}%`,
                       background: `linear-gradient(90deg, #F97316, ${accent})`,
                     }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                <span>Total: ₹{(fundingState.total_allocated / 1000).toFixed(1)}k Cr</span>
                <span>{Math.round(fundingState.total_released / Math.max(1, fundingState.total_allocated) * 100)}% utilized</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 24-month trend ──────────────────────────────── */}
        {history && kpis.length > 0 && (
          <div>
            <SectionLabel accent={accent} label={`${kpis[0].name} · 24-month trend`} />
            <div className="mt-2 rounded-xl p-3 bg-white border border-slate-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history.months?.map((m: string, i: number) => ({ month: m, v: history.series?.[kpis[0].code]?.[i] }))}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="deptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} tickLine={false} axisLine={false} width={28} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)" }}
                      labelStyle={{ color: "#64748B", fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={2.2} fill="url(#deptGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Central schemes ─────────────────────────────── */}
        {centralSchemes.length > 0 && (
          <div>
            <SectionLabel accent="#EA580C" label="Central Government Schemes" icon={<Landmark size={12} />} />
            <div className="mt-2 space-y-2">
              {centralSchemes.map((s: any) => {
                const v = lookupPath(stateSnap?.schemes, s.value_path);
                return <SchemeRow key={s.code} scheme={s} value={v} tier="Central" />;
              })}
            </div>
          </div>
        )}

        {/* ── State schemes ───────────────────────────────── */}
        {stateSchemes.length > 0 && (
          <div>
            <SectionLabel accent="#16A34A" label={`State Schemes · ${stateName === "Gujarat" ? "Gujarat" : "Tamil Nadu"}`} icon={<Building2 size={12} />} />
            <div className="mt-2 space-y-2">
              {stateSchemes.map((s: any) => {
                const v = lookupPath(stateSnap?.schemes, s.value_path);
                return <SchemeRow key={s.code} scheme={s} value={v} tier="State" />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ accent, label, icon }: { accent: string; label: string; icon?: any }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
         style={{ color: accent }}>
      {icon && icon}<span>{label}</span>
    </div>
  );
}

function SchemeRow({ scheme, value, tier }: any) {
  const fmtd = fmt(value, scheme.format ?? "int");
  const isCentral = tier === "Central";
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-100"
         style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: isCentral ? "#EA580C" : "#16A34A",
                         background: isCentral ? "#FFF7ED" : "#F0FDF4",
                         border: `1px solid ${isCentral ? "#FED7AA" : "#BBF7D0"}` }}>
            {tier}
          </span>
        </div>
        <div className="text-[12px] font-semibold text-slate-800 leading-tight">{scheme.name}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{scheme.metric}</div>
      </div>
      <div className="fig text-[17px] font-black shrink-0 text-slate-700">
        {fmtd}
        {fmtd !== "—" && <span className="text-[9px] text-slate-400 font-normal ml-1">{scheme.unit}</span>}
      </div>
    </div>
  );
}
