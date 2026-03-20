import { useState, useEffect, useMemo } from "react";
import { patients as patientsApi, content as contentApi } from "@/api/index.js";
import { fmtTimeTo12h } from "@/lib/utils.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.js";

const STATUSES = {
  lead:              { label: "Лид",       color: "#7A7A7A", bg: "#F0F0F0" },
  unresponsive:      { label: "Нет отв",   color: "#E67E22", bg: "#FFF3E0" },
  scheduled:        { label: "Запись",    color: "#1565C0", bg: "#E3F2FD" },
  completed:        { label: "Проведена", color: "#2E7D32", bg: "#E8F5E9" },
  cancelled:        { label: "Отмена",    color: "#C62828", bg: "#FFEBEE" },
  waiting_list:     { label: "WL",        color: "#6A1B9A", bg: "#F3E5F5" },
  surgery_scheduled: { label: "Операция", color: "#AD1457", bg: "#FCE4EC" },
  surgery_done:     { label: "Сделана",   color: "#1B5E20", bg: "#E8F5E9" },
};

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

// Doctor colors for visual distinction
const DOCTOR_COLORS = [
  "#C4956A", "#7B68EE", "#27AE60", "#E67E22", "#E74C3C", "#1565C0",
];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [patients, setPatients] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [selected, setSelected] = useState(null); // selected date
  const [view, setView] = useState("month"); // month | week

  useEffect(() => {
    patientsApi.list().then(setPatients);
    contentApi.get("specialists").then(setSpecialists);
  }, []);

  const doctorList = useMemo(() => [...new Set(patients.map(p => p.doctor).filter(Boolean))], [patients]);
  const doctorColorMap = useMemo(() => {
    const m = {};
    doctorList.forEach((d, i) => { m[d] = DOCTOR_COLORS[i % DOCTOR_COLORS.length]; });
    return m;
  }, [doctorList]);

  // Group patients by consultation_date
  const byDate = useMemo(() => {
    const m = {};
    patients.forEach(p => {
      const d = p.consultation_date;
      if (!d) return;
      if (!m[d]) m[d] = [];
      m[d].push(p);
    });
    return m;
  }, [patients]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const firstDay = firstDayOfMonth(year, month);
  const days = daysInMonth(year, month);
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: days }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  const selectedPatients = selected ? (byDate[selected] || []) : [];

  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
          <p className="text-sm text-muted mt-1">Консультации по врачам и датам</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar */}
        <div className="flex-1">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent-light cursor-pointer transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-base font-bold">{MONTHS_RU[month]} {year}</span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent-light cursor-pointer transition-colors"><ChevronRight size={16} /></button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className={cn("text-center text-[11px] font-bold py-2", d === "Сб" || d === "Вс" ? "text-red-400" : "text-muted")}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = isoDate(year, month, day);
              const dayPatients = byDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;
              const dayOfWeek = (i % 7); // 0=Mon

              return (
                <button
                  key={i}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[72px] rounded-xl p-2 text-left flex flex-col cursor-pointer border transition-all",
                    isSelected ? "border-accent bg-accent-light" : isToday ? "border-accent/40 bg-accent/5" : "border-transparent hover:border-portal-border hover:bg-white",
                    dayOfWeek >= 5 ? "bg-red-50/30" : "",
                  )}
                >
                  <span className={cn("text-xs font-bold mb-1", isToday ? "text-accent" : dayOfWeek >= 5 ? "text-red-400" : "text-[#1A1A1A]")}>{day}</span>
                  <div className="flex flex-col gap-0.5">
                    {dayPatients.slice(0, 3).map((p, pi) => {
                      const st = STATUSES[p.status] || STATUSES.lead;
                      const docColor = doctorColorMap[p.doctor] || "#7A7A7A";
                      return (
                        <div
                          key={pi}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate leading-tight"
                          style={{ backgroundColor: st.bg, color: st.color, borderLeft: `2px solid ${docColor}` }}
                        >
                          {p.consultation_time ? fmtTimeTo12h(p.consultation_time) + " " : ""}{p.name.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayPatients.length > 3 && (
                      <div className="text-[9px] text-muted font-semibold">+{dayPatients.length - 3} ещё</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Doctor legend */}
          {doctorList.length > 0 && (
            <div className="mt-5 bg-white border border-portal-border rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Специалисты</div>
              <div className="flex flex-wrap gap-3">
                {doctorList.map(d => (
                  <div key={d} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: doctorColorMap[d] }} />
                    <span className="text-xs text-[#1A1A1A]">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: selected day details + specialist schedule */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
          {/* Selected day */}
          {selected ? (
            <div className="bg-white border border-portal-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-portal-border bg-accent-light">
                <div className="text-sm font-bold text-accent">{selected}</div>
                <div className="text-xs text-muted">{selectedPatients.length} записей</div>
              </div>
              <div className="divide-y divide-portal-border max-h-96 overflow-y-auto">
                {selectedPatients.length === 0 ? (
                  <div className="px-4 py-6 text-xs text-muted text-center">Нет записей</div>
                ) : selectedPatients
                    .sort((a, b) => (a.consultation_time || "").localeCompare(b.consultation_time || ""))
                    .map((p, i) => {
                      const st = STATUSES[p.status] || STATUSES.lead;
                      const docColor = doctorColorMap[p.doctor] || "#7A7A7A";
                      return (
                        <div key={i} className="px-4 py-3 flex items-start gap-2.5">
                          <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: docColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{p.name}</div>
                            <div className="text-[11px] text-muted">{p.doctor} · {p.procedure}</div>
                            {p.consultation_time && (
                              <div className="text-[11px] font-semibold text-accent">{fmtTimeTo12h(p.consultation_time)}</div>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                      );
                    })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-portal-border rounded-xl px-4 py-6 text-center text-xs text-muted">
              Нажмите на день чтобы увидеть записи
            </div>
          )}

          {/* Specialist availability */}
          <div className="bg-white border border-portal-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-portal-border">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">Расписание специалистов</div>
            </div>
            <div className="divide-y divide-portal-border">
              {specialists.map((sp, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="text-xs font-semibold text-[#1A1A1A] mb-0.5">{sp.name}</div>
                  <div className="text-[11px] text-muted">{sp.days}</div>
                  <div className="text-[11px] text-muted">{sp.time}</div>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sp.format === "Онлайн" ? "#E3F2FD" : "#F3E5F5", color: sp.format === "Онлайн" ? "#1565C0" : "#6A1B9A" }}>
                      {sp.format}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Month summary */}
          {(() => {
            const monthPats = patients.filter(p => {
              const d = p.consultation_date || "";
              return d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
            });
            const byDoc = {};
            monthPats.forEach(p => { if (p.doctor) byDoc[p.doctor] = (byDoc[p.doctor] || 0) + 1; });
            const topDocs = Object.entries(byDoc).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return monthPats.length > 0 ? (
              <div className="bg-white border border-portal-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-portal-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">Месяц: {MONTHS_RU[month]}</div>
                  <div className="text-[11px] text-muted mt-0.5">{monthPats.length} записей</div>
                </div>
                <div className="px-4 py-3">
                  {topDocs.map(([doc, cnt], i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-xs text-[#1A1A1A] truncate">{doc}</span>
                      <span className="text-xs font-bold text-accent ml-2">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
