import { useState, useEffect, useMemo } from "react";
import { patients as patientsApi } from "@/api/index.js";
import { fmtShortDate, todayISO } from "@/lib/utils.js";
import { TrendingUp, Users, CalendarCheck, XCircle, Activity, Phone } from "lucide-react";

const STATUSES = {
  lead:              { label: "Лид",               color: "#7A7A7A", bg: "#F0F0F0" },
  unresponsive:      { label: "Не отвечает",        color: "#E67E22", bg: "#FFF3E0" },
  scheduled:        { label: "Запись",             color: "#1565C0", bg: "#E3F2FD" },
  completed:        { label: "Проведена",          color: "#2E7D32", bg: "#E8F5E9" },
  cancelled:        { label: "Отмена",             color: "#C62828", bg: "#FFEBEE" },
  waiting_list:     { label: "Waiting List",       color: "#6A1B9A", bg: "#F3E5F5" },
  surgery_scheduled: { label: "Операция",          color: "#AD1457", bg: "#FCE4EC" },
  surgery_done:     { label: "Операция проведена", color: "#1B5E20", bg: "#E8F5E9" },
};

const SOURCES = ["Instagram", "Facebook", "Google", "TikTok", "Referral (friend)", "Referral (doctor)", "WhatsApp / Direct", "Другое"];

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function StatCard({ icon: Icon, label, value, sub, color = "#C4956A", bg = "#F5EDE3" }) {
  return (
    <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={17} style={{ color }} />
        </div>
        <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
      </div>
      <div className="text-xs font-semibold text-[#1A1A1A]">{label}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function BarChart({ data, colorKey = "color", bgKey = "bg" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-xs text-[#1A1A1A] truncate flex-shrink-0">{d.label}</div>
          <div className="flex-1 h-6 bg-portal-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full flex items-center px-2 transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d[bgKey] || "#F5EDE3", minWidth: d.value > 0 ? 24 : 0 }}
            >
              {d.value > 0 && <span className="text-[10px] font-bold" style={{ color: d[colorKey] || "#C4956A" }}>{d.value}</span>}
            </div>
          </div>
          <div className="w-8 text-xs font-semibold text-muted text-right">{pct(d.value, data.reduce((s, x) => s + x.value, 0))}%</div>
        </div>
      ))}
    </div>
  );
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function ReportsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30"); // days

  useEffect(() => {
    patientsApi.list().then(data => { setPatients(data); setLoading(false); });
  }, []);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const inRange = useMemo(() => patients.filter(p => (p.created_at || "").slice(0, 10) >= cutoff), [patients, cutoff]);

  // Status breakdown
  const statusCounts = useMemo(() => {
    const map = {};
    inRange.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([id, value]) => ({ label: STATUSES[id]?.label || id, value, color: STATUSES[id]?.color || "#7A7A7A", bg: STATUSES[id]?.bg || "#F0F0F0" })).sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Source breakdown
  const sourceCounts = useMemo(() => {
    const map = {};
    inRange.forEach(p => { const k = p.source || "Не указан"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: "#C4956A", bg: "#F5EDE3" })).sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Doctor breakdown
  const doctorCounts = useMemo(() => {
    const map = {};
    inRange.forEach(p => { const k = p.doctor || "Не указан"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: "#7B68EE", bg: "#EEE8FF" })).sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Language breakdown
  const langCounts = useMemo(() => {
    const map = {};
    inRange.forEach(p => { const k = p.language || "Не указан"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: "#10B981", bg: "#D1FAE5" })).sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Budget breakdown
  const budgetCounts = useMemo(() => {
    const map = {};
    inRange.forEach(p => { const k = p.budget || "Не указан"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: "#27AE60", bg: "#E8F5E9" })).sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Daily trend (leads created per day)
  const days = useMemo(() => last30Days().slice(-parseInt(range)), [range]);
  const dailyLeads = useMemo(() => {
    const map = {};
    inRange.forEach(p => { const d = (p.created_at || "").slice(0, 10); map[d] = (map[d] || 0) + 1; });
    return days.map(d => ({ date: d, count: map[d] || 0 }));
  }, [inRange, days]);

  const completed = inRange.filter(p => p.status === "completed").length;
  const convRate = pct(completed, inRange.length);
  const unresponsive = inRange.filter(p => p.status === "unresponsive").length;
  const scheduled = inRange.filter(p => p.status === "scheduled").length;

  if (loading) return <div className="text-sm text-muted py-8 text-center">Загрузка...</div>;

  const maxDaily = Math.max(...dailyLeads.map(d => d.count), 1);

  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика</h1>
          <p className="text-sm text-muted mt-1">Маркетинговые показатели и воронка продаж</p>
        </div>
        <select
          value={range}
          onChange={e => setRange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm outline-none cursor-pointer focus:border-accent"
        >
          <option value="7">Последние 7 дней</option>
          <option value="14">Последние 14 дней</option>
          <option value="30">Последние 30 дней</option>
          <option value="90">Последние 90 дней</option>
          <option value="365">Последние 365 дней</option>
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}       label="Всего лидов"         value={inRange.length}   sub={`за ${range} дней`} />
        <StatCard icon={CalendarCheck} label="Консультации проведены" value={completed}      sub={`конверсия ${convRate}%`} color="#2E7D32" bg="#E8F5E9" />
        <StatCard icon={Phone}       label="Не отвечает"         value={unresponsive}     sub={`${pct(unresponsive, inRange.length)}% лидов`} color="#E67E22" bg="#FFF3E0" />
        <StatCard icon={Activity}    label="Записаны"            value={scheduled}        sub="активных записей" color="#1565C0" bg="#E3F2FD" />
      </div>

      {/* Daily trend */}
      <div className="bg-white border border-portal-border rounded-xl px-5 py-4 mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Лиды по дням</div>
        <div className="flex items-end gap-1 h-24">
          {dailyLeads.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-sm bg-accent/70 hover:bg-accent transition-colors cursor-default"
                  style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                  title={`${d.date}: ${d.count}`}
                />
              </div>
              {(i === 0 || i === Math.floor(dailyLeads.length / 2) || i === dailyLeads.length - 1) && (
                <div className="text-[9px] text-muted whitespace-nowrap">{fmtShortDate(d.date)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">По статусам</div>
          <BarChart data={statusCounts} />
        </div>
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Источники лидов</div>
          <BarChart data={sourceCounts} colorKey="color" bgKey="bg" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">По специалистам</div>
          <BarChart data={doctorCounts} />
        </div>
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Языки</div>
          <BarChart data={langCounts} />
        </div>
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Бюджет</div>
          <BarChart data={budgetCounts} />
        </div>
      </div>

      {/* Marketing insights */}
      {inRange.length > 0 && (
        <div className="bg-white border border-portal-border rounded-xl px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Маркетинговые инсайты</div>
          <div className="grid grid-cols-2 gap-4">
            {sourceCounts[0] && (
              <div className="bg-portal-bg rounded-xl p-4">
                <div className="text-xs text-muted mb-1">Лучший источник лидов</div>
                <div className="text-base font-bold text-[#1A1A1A]">{sourceCounts[0].label}</div>
                <div className="text-xs text-accent font-semibold">{sourceCounts[0].value} лидов ({pct(sourceCounts[0].value, inRange.length)}%)</div>
              </div>
            )}
            {doctorCounts[0] && (
              <div className="bg-portal-bg rounded-xl p-4">
                <div className="text-xs text-muted mb-1">Самый популярный специалист</div>
                <div className="text-base font-bold text-[#1A1A1A]">{doctorCounts[0].label}</div>
                <div className="text-xs text-accent font-semibold">{doctorCounts[0].value} запросов</div>
              </div>
            )}
            <div className="bg-portal-bg rounded-xl p-4">
              <div className="text-xs text-muted mb-1">Конверсия лид → консультация</div>
              <div className="text-base font-bold text-[#1A1A1A]">{convRate}%</div>
              <div className="text-xs text-muted">{completed} из {inRange.length} лидов</div>
            </div>
            <div className="bg-portal-bg rounded-xl p-4">
              <div className="text-xs text-muted mb-1">Недозвон / нет ответа</div>
              <div className="text-base font-bold text-[#1A1A1A]">{pct(unresponsive, inRange.length)}%</div>
              <div className="text-xs text-muted">{unresponsive} лидов без контакта</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
