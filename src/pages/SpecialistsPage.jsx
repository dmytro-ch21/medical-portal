import { useState, useEffect } from "react";
import { content as contentApi } from "@/api/index.js";
import { CalendarDays, Clock } from "lucide-react";

const NOTE_STYLES = {
  warning: { bg: "#FFF8E1", color: "#F57F17", border: "#FFE082" },
  info:    { bg: "#E3F2FD", color: "#1565C0", border: "#90CAF9" },
  success: { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  danger:  { bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  clinic:  { bg: "#F3E5F5", color: "#6A1B9A", border: "#CE93D8" },
};

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState([]);
  const [coordRules, setCoordRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      contentApi.get("specialists"),
      contentApi.get("coord_rules"),
    ]).then(([specs, rules]) => {
      setSpecialists(specs);
      setCoordRules(rules);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-muted py-8 text-center">Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Специалисты</h1>
      <p className="text-sm text-muted mb-6">Расписание, специализация и ограничения</p>

      {/* Coord rules */}
      {coordRules.length > 0 && (
        <div className="mb-7">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">Важно — нагрузка координаторов</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {coordRules.map((r, i) => (
              <div key={i} className="flex gap-3 bg-white border border-portal-border rounded-xl px-4 py-3 items-start" style={{ borderLeft: `3px solid ${r.color}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: `${r.color}22` }}>
                  {r.icon}
                </div>
                <span className="text-sm text-[#333] leading-relaxed">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specialists */}
      <div className="flex flex-col gap-4">
        {specialists.map((sp, i) => {
          const ns = NOTE_STYLES[sp.noteType] || NOTE_STYLES.info;
          const accentColor = sp.format === "Онлайн" ? "#1565C0" : "#6A1B9A";
          const formatStyle = sp.format === "Онлайн"
            ? { bg: "#E3F2FD", color: "#1565C0" }
            : { bg: "#F3E5F5", color: "#6A1B9A" };

          return (
            <div key={i} className="bg-white border border-portal-border rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${accentColor}` }}>
              <div className="px-5 pt-4 pb-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="text-base font-bold leading-snug">{sp.name}</div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: formatStyle.bg, color: formatStyle.color }}>{sp.format}</span>
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <span className="flex items-center gap-1.5 text-sm text-[#444]">
                    <CalendarDays size={14} className="text-accent flex-shrink-0" />
                    {sp.days}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[#444]">
                    <Clock size={14} className="text-muted flex-shrink-0" />
                    {sp.time}
                  </span>
                </div>

                <div className="border-t border-portal-border my-3" />

                {/* Procedures */}
                <div className={`grid gap-4 ${sp.doesNot && sp.doesNot.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-2">✅ Делает</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sp.does || []).map((d, j) => (
                        <span key={j} className="text-xs px-2.5 py-1 rounded-md" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>{d}</span>
                      ))}
                    </div>
                  </div>
                  {sp.doesNot && sp.doesNot.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-2">❌ Не делает</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sp.doesNot.map((d, j) => (
                          <span key={j} className="text-xs px-2.5 py-1 rounded-md" style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Note callout */}
              {sp.note && (
                <div className="px-5 py-2.5 text-xs font-semibold border-t" style={{ backgroundColor: ns.bg, color: ns.color, borderColor: ns.border }}>
                  {sp.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
