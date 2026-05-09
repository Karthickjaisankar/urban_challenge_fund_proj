import { useEffect, useRef, useState } from "react";
import { Flag, X, Send, ChevronDown, Clock, CheckCircle, XCircle, Search, AlertOctagon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─────────────────────────────────────────────────────── types ── */
interface TickerButtonProps {
  district: string;
  state: string;
  department: string;
  kpiCode: string;
  kpiLabel: string;
  currentValue: number;
  unit: string;
}

/* ─────────────────────────────────────────────────────── colour ── */
const STATUS_ICON: Record<string, any> = {
  open:       <Clock size={13} className="text-saffron-600" />,
  reviewing:  <Search size={13} className="text-ashoka-500" />,
  validated:  <CheckCircle size={13} className="text-emerald2-600" />,
  rejected:   <XCircle size={13} className="text-ruby-600" />,
  closed:     <CheckCircle size={13} className="text-ink2-400" />,
};
const STATUS_COLOR: Record<string, string> = {
  open:      "#ff7722",
  reviewing: "#0c4ca3",
  validated: "#128807",
  rejected:  "#b81d24",
  closed:    "#7a7565",
};
const SEVERITY_COLOR: Record<string, string> = {
  low:    "#128807",
  medium: "#ff7722",
  high:   "#b81d24",
};

/* ════════════════════════════════════════════════════════════════
   TickerButton — small flag icon on each KPI tile / scheme tile
═══════════════════════════════════════════════════════════════ */
export function TickerButton(props: TickerButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Flag discrepancy or log action taken"
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink2-400 hover:text-saffron-600 transition"
      >
        <Flag size={11} />
        <span className="hidden sm:inline">Flag</span>
      </button>
      {open && <TickerModal {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   TickerModal — full submission form
═══════════════════════════════════════════════════════════════ */
function TickerModal(props: TickerButtonProps & { onClose: () => void }) {
  const { district, state, department, kpiCode, kpiLabel, currentValue, unit, onClose } = props;
  const qc = useQueryClient();
  const [form, setForm] = useState({
    raised_by:      "",
    role:           "collector" as const,
    ticket_type:    "discrepancy" as const,
    severity:       "medium" as const,
    reported_value: "",
    notes:          "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.raised_by || !form.notes) return;
    await api.ticketsCreate({
      ...form,
      district, state, department,
      kpi_code: kpiCode, kpi_label: kpiLabel,
      current_value: currentValue,
      reported_value: form.reported_value ? parseFloat(form.reported_value) : null,
      unit,
    });
    await qc.invalidateQueries({ queryKey: ["tickets"] });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-ink2-800/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-cardHover w-full max-w-[520px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(90deg, #ff7722 0%, #b94d0a 100%)" }}>
          <div className="flex items-center gap-2.5 text-white">
            <Flag size={18} />
            <div>
              <div className="text-[13px] font-black uppercase tracking-widest">Raise a Ticker</div>
              <div className="text-[11px] opacity-85">{district} · {kpiLabel}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X size={20} /></button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <CheckCircle size={52} className="text-emerald2-500 mx-auto mb-4" />
            <div className="text-xl font-black text-ink2-800">Ticker Raised</div>
            <div className="text-[13px] text-ink2-400 mt-2">Your report has been submitted for review by state officers.</div>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl text-white font-bold text-[13px]"
                    style={{ background: "#128807" }}>Close</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Current value display */}
            <div className="rounded-xl border border-ink2-200/40 px-4 py-3 bg-cream-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink2-400 font-bold">Current displayed value</div>
                <div className="fig display text-2xl font-black" style={{ color: "#0c4ca3" }}>{currentValue.toFixed(1)} <span className="text-[13px] text-ink2-400">{unit}</span></div>
              </div>
              <AlertOctagon size={28} className="text-saffron-500" />
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Your name / designation <span className="text-ruby-600">*</span></label>
                <input value={form.raised_by} onChange={e => set("raised_by", e.target.value)}
                  placeholder="e.g. Collector, Vellore / DHS Tamil Nadu"
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500" />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Role</label>
                <select value={form.role} onChange={e => set("role", e.target.value)}
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500">
                  <option value="collector">District Collector</option>
                  <option value="state_officer">State Officer</option>
                  <option value="central_officer">Central Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Type</label>
                <select value={form.ticket_type} onChange={e => set("ticket_type", e.target.value)}
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500">
                  <option value="discrepancy">Data Discrepancy</option>
                  <option value="action_taken">Action Taken</option>
                  <option value="data_update">Data Update Request</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Severity</label>
                <select value={form.severity} onChange={e => set("severity", e.target.value)}
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Correct value (if known)</label>
                <input type="number" step="0.1" value={form.reported_value} onChange={e => set("reported_value", e.target.value)}
                  placeholder={`e.g. ${(currentValue * 0.9).toFixed(1)}`}
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink2-500 mb-1">Notes <span className="text-ruby-600">*</span></label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
                  placeholder="Describe the discrepancy, action taken, or what correction is needed..."
                  className="w-full border-2 border-ink2-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-saffron-500 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-ink2-500 hover:text-ink2-800 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={!form.raised_by || !form.notes}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold disabled:opacity-40 transition"
                style={{ background: form.raised_by && form.notes ? "linear-gradient(90deg, #ff7722, #b94d0a)" : undefined }}>
                <Send size={14} /> Submit Ticker
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TickerInbox — slide-in panel accessible from the header
═══════════════════════════════════════════════════════════════ */
interface TickerInboxProps { onClose: () => void }

export function TickerInbox({ onClose }: TickerInboxProps) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["tickets"], queryFn: () => api.ticketsList(), refetchInterval: 10_000 });
  const tickets = data?.tickets ?? [];
  const [updating, setUpdating] = useState<string | null>(null);

  const advance = async (id: string, nextStatus: string, actor = "State Officer") => {
    setUpdating(id);
    await api.ticketUpdate(id, { status: nextStatus, actor });
    await qc.invalidateQueries({ queryKey: ["tickets"] });
    setUpdating(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[2500] w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0"
           style={{ background: "linear-gradient(90deg, #ff7722 0%, #b94d0a 100%)" }}>
        <div className="text-white">
          <div className="text-[14px] font-black uppercase tracking-widest flex items-center gap-2"><Flag size={16} /> Collector Tickers</div>
          <div className="text-[11px] opacity-80 mt-0.5">{tickets.length} total · click to advance status</div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink2-200/40">
        {tickets.length === 0 && (
          <div className="p-10 text-center text-ink2-400">
            <Flag size={36} className="mx-auto mb-3 opacity-30" />
            <div className="font-semibold">No tickers raised yet.</div>
            <div className="text-[12px] mt-1">Click the Flag icon on any KPI tile to raise one.</div>
          </div>
        )}
        {tickets.map((t: any) => (
          <div key={t.id} className="p-5 hover:bg-cream-50 transition">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-ink2-400">#{t.id}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: SEVERITY_COLOR[t.severity], background: SEVERITY_COLOR[t.severity] + "18" }}>
                    {t.severity.toUpperCase()}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold flex items-center gap-1" style={{ color: STATUS_COLOR[t.status], background: STATUS_COLOR[t.status] + "15" }}>
                    {STATUS_ICON[t.status]} {t.status}
                  </span>
                </div>
                <div className="text-[13px] font-bold text-ink2-800 mt-1">{t.kpi_label} · {t.district}</div>
                <div className="text-[11px] text-ink2-400 mt-0.5">{t.ticket_type.replace("_", " ")} by {t.raised_by}</div>
              </div>
            </div>

            {/* Values */}
            <div className="flex items-center gap-4 mb-2 text-[12px]">
              {t.current_value != null && (
                <span className="text-ink2-600">Dashboard: <strong>{t.current_value.toFixed(1)}</strong></span>
              )}
              {t.reported_value != null && (
                <>
                  <span className="text-ink2-300">→</span>
                  <span className="text-emerald2-600">Reported: <strong>{t.reported_value.toFixed(1)}</strong></span>
                </>
              )}
              <span className="text-ink2-400 font-mono">{t.unit}</span>
            </div>

            <p className="text-[12px] text-ink2-600 leading-relaxed mb-3">{t.notes}</p>

            {/* Action buttons for state/central officers */}
            <div className="flex items-center gap-2 flex-wrap">
              {t.status === "open" && (
                <button onClick={() => advance(t.id, "reviewing")} disabled={updating === t.id}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ background: "#0c4ca3" }}>Review</button>
              )}
              {t.status === "reviewing" && (<>
                <button onClick={() => advance(t.id, "validated", "State Data Officer")} disabled={updating === t.id}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ background: "#128807" }}>Validate &amp; Update</button>
                <button onClick={() => advance(t.id, "rejected", "State Data Officer")} disabled={updating === t.id}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ background: "#b81d24" }}>Reject</button>
              </>)}
              {(t.status === "validated" || t.status === "rejected") && (
                <button onClick={() => advance(t.id, "closed")} disabled={updating === t.id}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg border-2 border-ink2-200 text-ink2-500 disabled:opacity-50">
                  Close
                </button>
              )}
              <span className="ml-auto text-[10px] font-mono text-ink2-400">{t.created_at.slice(0, 16).replace("T", " ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TickerHeaderButton — badge + toggle in the top header
═══════════════════════════════════════════════════════════════ */
export function TickerHeaderButton() {
  const [inboxOpen, setInboxOpen] = useState(false);
  const { data } = useQuery({ queryKey: ["tickets-stats"], queryFn: api.ticketsStats, refetchInterval: 15_000 });
  const openCount = (data?.open ?? 0) + (data?.reviewing ?? 0);

  return (
    <>
      <button
        onClick={() => setInboxOpen(true)}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-saffron-300/40 bg-saffron-50 hover:bg-saffron-100 transition"
      >
        <Flag size={14} className="text-saffron-600" />
        <span className="text-[12px] font-bold text-saffron-700 hidden sm:inline">Tickers</span>
        {openCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                style={{ background: "#b81d24" }}>
            {openCount}
          </span>
        )}
      </button>
      {inboxOpen && <TickerInbox onClose={() => setInboxOpen(false)} />}
    </>
  );
}
