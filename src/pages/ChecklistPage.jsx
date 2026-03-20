import { useState, useEffect } from "react";
import { checklist as checklistApi, content as contentApi } from "@/api/index.js";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.js";

export default function ChecklistPage() {
  const [sections, setSections] = useState([]);
  const [reference, setReference] = useState(null);
  const [checked, setChecked] = useState({});
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    checklistApi.list().then((data) => {
      setSections(data);
      if (data.length > 0) setActiveSection(data[0].id);
    });
    contentApi.get("reference").then(setReference);
  }, []);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const resetAll = () => setChecked({});

  const countChecked = (sec) => {
    const mainItems = sec.items.filter(i => !i.subgroup);
    const done = sec.items.filter((item, idx) => checked[`${sec.id}-${item.id}`]).length;
    return { done, total: sec.items.length };
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const totalDone = Object.values(checked).filter(Boolean).length;
  const current = sections.find(s => s.id === activeSection);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Чек-лист дня</h1>
          <p className="text-sm text-muted mt-1">Главная цель: довести клиента до проведённой консультации</p>
        </div>
        {activeTab === "workflow" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(r => !r)}
              className={cn("px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors", showRules ? "border-accent bg-accent-light text-accent" : "border-portal-border text-muted hover:border-accent")}
            >
              Rules
            </button>
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg border border-portal-border text-xs font-semibold text-muted cursor-pointer hover:border-accent transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-tag rounded-xl p-1 w-fit mb-6">
        {[{ id: "workflow", label: "Воркфлоу" }, { id: "reference", label: "Справочник" }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("px-5 py-2 rounded-lg text-sm cursor-pointer transition-all", activeTab === tab.id ? "bg-white text-[#1A1A1A] font-semibold shadow-sm" : "text-muted")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "workflow" && (
        <div>
          {/* Rules panel */}
          {showRules && (
            <div className="bg-white border border-portal-border rounded-xl p-5 mb-5">
              <div className="text-[10px] font-bold tracking-widest uppercase text-accent mb-3">Основные правила</div>
              <div className="grid grid-cols-3 gap-2">
                {(reference?.rules || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-portal-bg border border-portal-border rounded-lg px-3 py-2">
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs leading-tight">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="bg-white border border-portal-border rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Общий прогресс за день</span>
              <span className="text-sm font-bold text-accent">{totalDone} / {totalItems}</span>
            </div>
            <div className="h-1.5 bg-portal-border rounded-full">
              <div
                className="h-1.5 bg-accent rounded-full transition-all duration-300"
                style={{ width: `${totalItems ? (totalDone / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-5">
            {/* Section nav */}
            <div className="w-48 flex-shrink-0">
              {sections.map(sec => {
                const { done, total } = countChecked(sec);
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? sec.color + "18" : "transparent",
                      border: `1px solid ${isActive ? sec.color + "60" : "transparent"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{sec.icon}</span>
                      <span className="text-xs" style={{ fontWeight: isActive ? 600 : 400, color: isActive ? "#1A1A1A" : "#7A7A7A" }}>{sec.label}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: done === total ? "#E8F5E9" : (isActive ? sec.color + "25" : "#EEE8E0"),
                        color: done === total ? "#2E7D32" : (isActive ? sec.color : "#7A7A7A"),
                      }}
                    >
                      {done}/{total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Items panel */}
            {current && (
              <div className="flex-1">
                <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: current.color + "12", border: `1px solid ${current.color}40` }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xl">{current.icon}</span>
                    <span className="text-base font-bold">{current.label}</span>
                  </div>
                  {(() => {
                    const { done, total } = countChecked(current);
                    return (
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-muted">{done} из {total} выполнено</span>
                          {done === total && <span className="text-xs font-semibold text-green-700">Готово!</span>}
                        </div>
                        <div className="h-1 rounded-full" style={{ backgroundColor: current.color + "30" }}>
                          <div className="h-1 rounded-full transition-all duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: current.color }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Group items by subgroup */}
                {(() => {
                  const mainItems = current.items.filter(i => !i.subgroup);
                  const subgroups = [...new Set(current.items.filter(i => i.subgroup).map(i => i.subgroup))];

                  return (
                    <>
                      <div className="bg-white border border-portal-border rounded-xl overflow-hidden mb-3">
                        {mainItems.map((item, idx) => {
                          const key = `${current.id}-${item.id}`;
                          const isChecked = !!checked[key];
                          const isImportant = item.text.startsWith("❗");
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggle(key)}
                              className={cn("flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors", isChecked ? "bg-green-50" : "hover:bg-portal-bg", idx < mainItems.length - 1 ? "border-b border-portal-border" : "")}
                            >
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                  border: `2px solid ${isChecked ? current.color : "#E8E2DA"}`,
                                  backgroundColor: isChecked ? current.color : "transparent",
                                }}
                              >
                                {isChecked && <span className="text-white text-[10px] font-bold">✓</span>}
                              </div>
                              <span className={cn("text-sm", isChecked ? "text-muted line-through" : isImportant ? "text-red-700 font-bold" : "text-[#1A1A1A]")}>
                                {item.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {subgroups.map(sg => (
                        <div key={sg} className="bg-white border border-portal-border rounded-xl overflow-hidden mb-3">
                          <div className="px-5 py-2.5 border-b border-portal-border text-[10px] font-bold uppercase tracking-wider" style={{ color: current.color }}>
                            {sg}
                          </div>
                          {current.items.filter(i => i.subgroup === sg).map((item, idx, arr) => {
                            const key = `${current.id}-${item.id}`;
                            const isChecked = !!checked[key];
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggle(key)}
                                className={cn("flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors", isChecked ? "bg-green-50" : "hover:bg-portal-bg", idx < arr.length - 1 ? "border-b border-portal-border" : "")}
                              >
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                                  style={{
                                    border: `2px solid ${isChecked ? current.color : "#E8E2DA"}`,
                                    backgroundColor: isChecked ? current.color : "transparent",
                                  }}
                                >
                                  {isChecked && <span className="text-white text-[10px] font-bold">✓</span>}
                                </div>
                                <span className={cn("text-sm", isChecked ? "text-muted line-through" : "text-[#1A1A1A]")}>
                                  {item.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "reference" && <ReferenceTab reference={reference} />}
    </div>
  );
}

function ReferenceTab({ reference }) {
  const [open, setOpen] = useState(null);
  const tog = (id) => setOpen(prev => prev === id ? null : id);

  const bodyProcs = reference?.bodyProcedures || ["Грудь", "Живот", "Липосакция", "BBL"];
  const faceProcs = reference?.faceProcedures || ["Подтяжка лица", "Brow lift", "Шея", "SMAS", "Deep Plane", "Блефаро", "Нос", "Уши"];
  const freeConsult = reference?.freeConsult || ["Тело", "Грудь", "Живот", "Блефаро", "Нос", "Уши"];
  const paidConsult = reference?.paidConsult || ["Подтяжка лица", "SMAS", "Deep Plane", "Шея", "Brow lift"];
  const keyPhrases = reference?.keyPhrases || [];
  const algorithm = reference?.algorithm || [];

  const blocks = [
    {
      id: "procedures", icon: "🧠", label: "Типы процедур", color: "#6366F1",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1] mb-3">Body (Тело)</div>
            {bodyProcs.map((p, i, arr) => (
              <div key={i} className={cn("flex items-center gap-2 py-2", i < arr.length - 1 ? "border-b border-portal-border" : "")}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] flex-shrink-0" />
                <span className="text-sm">{p}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-pink-500 mb-3">Face (Лицо)</div>
            {faceProcs.map((p, i, arr) => (
              <div key={i} className={cn("flex items-center gap-2 py-2", i < arr.length - 1 ? "border-b border-portal-border" : "")}>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                <span className="text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "consult", icon: "💰", label: "Стоимость консультации", color: "#10B981",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-xs font-bold text-green-800 mb-3">Бесплатно</div>
            {freeConsult.map((p, i, arr) => (
              <div key={i} className={cn("text-sm text-green-900 py-1.5", i < arr.length - 1 ? "border-b border-green-200" : "")}>{p}</div>
            ))}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs font-bold text-red-800 mb-3">Платно ($50)</div>
            {paidConsult.map((p, i, arr) => (
              <div key={i} className={cn("text-sm text-red-900 py-1.5", i < arr.length - 1 ? "border-b border-red-200" : "")}>{p}</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "owners", icon: "🚫", label: "Owners — Сергеев / Шехерман", color: "#EF4444",
      content: (
        <div>
          <p className="text-sm text-[#555] mb-4">Если клиент хочет попасть к Сергееву или Шехерману:</p>
          {[["📋", "В waiting list"], ["🗣️", "Сказать: нет дат"], ["👥", "Предложить других специалистов"]].map(([icon, text], i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-2">
              <span className="text-base">{icon}</span>
              <span className="text-sm text-red-700 font-medium">{text}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "situations", icon: "❗", label: "Важные ситуации", color: "#F59E0B",
      content: (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-sm font-bold text-amber-700 mb-3">Беременность / ГВ</div>
            {[["❌", "Не записываем", "text-red-700"], ["✔", "Через 4 месяца после окончания ГВ", "text-green-700"], ["👉", "Отправить в warming up", "text-blue-700"]].map(([icon, text, cls], i) => (
              <div key={i} className="flex gap-2 items-start py-1.5">
                <span className="text-sm">{icon}</span>
                <span className={cn("text-sm font-medium", cls)}>{text}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-portal-border rounded-xl p-4">
            <div className="text-sm font-bold mb-3">Если клиент не может</div>
            {["Другой день", "Другой специалист", "Короткий перерыв на работе", "Waiting list", "Follow-up"].map((o, i, arr) => (
              <div key={i} className={cn("flex gap-2 items-center py-1.5", i < arr.length - 1 ? "border-b border-portal-border" : "")}>
                <span className="text-xs text-accent">→</span>
                <span className="text-sm">{o}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-portal-border rounded-xl p-4">
            <div className="text-sm font-bold mb-3">Не знаешь ответ — используй:</div>
            {["Это уточнит координатор на консультации", "Я уточню и вернусь к вам"].map((p, i) => (
              <div key={i} className={cn("text-sm text-[#555] py-2 italic", i === 0 ? "border-b border-portal-border" : "")}>"{p}"</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "lists", icon: "🧩", label: "Waiting List / Warming Up", color: "#8B5CF6",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-bold text-purple-800 mb-3">WAITING LIST</div>
            <p className="text-xs text-[#555] mb-2">Клиент хочет только:</p>
            {["Конкретного врача", "Только оффлайн", "Определённое время"].map((p, i, arr) => (
              <div key={i} className={cn("text-sm text-purple-800 py-1.5", i < arr.length - 1 ? "border-b border-purple-200" : "")}>• {p}</div>
            ))}
            <div className="mt-3 text-xs text-purple-700 font-semibold">Обязательно комментарий</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-xs font-bold text-green-800 mb-3">WARMING UP</div>
            <p className="text-xs text-[#555] mb-2">Клиент:</p>
            {["Не готов", "Думает", "Кормит грудью"].map((p, i, arr) => (
              <div key={i} className={cn("text-sm text-green-800 py-1.5", i < arr.length - 1 ? "border-b border-green-200" : "")}>• {p}</div>
            ))}
            <div className="mt-3 text-xs text-green-700 font-semibold">Обязательно комментарий</div>
          </div>
        </div>
      ),
    },
    {
      id: "phrases", icon: "💬", label: "Основные фразы", color: "#0EA5E9",
      content: (
        <div className="flex flex-col gap-2">
          {keyPhrases.map((phrase, i) => (
            <div key={i} className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
              <span className="text-base flex-shrink-0">💬</span>
              <span className="text-sm text-sky-900 italic">"{phrase}"</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "algorithm", icon: "🚀", label: "Супер-коротко (Алгоритм)", color: "#C4956A",
      content: (
        <div className="flex flex-wrap gap-2">
          {algorithm.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{ backgroundColor: i === algorithm.length - 1 ? "#F5EDE3" : "#F9F7F5", border: `1px solid ${i === algorithm.length - 1 ? "#C4956A" : "#E8E2DA"}` }}
            >
              <span className="text-[10px] font-extrabold text-accent">{i + 1}.</span>
              <span className="text-sm" style={{ color: i === algorithm.length - 1 ? "#C4956A" : "#1A1A1A", fontWeight: i === algorithm.length - 1 ? 700 : 400 }}>{step}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {blocks.map(block => {
        const isOpen = open === block.id;
        return (
          <div
            key={block.id}
            className="bg-white rounded-xl overflow-hidden"
            style={{ border: `1px solid ${isOpen ? block.color + "60" : "#E8E2DA"}` }}
          >
            <button
              onClick={() => tog(block.id)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left transition-colors"
              style={{ backgroundColor: isOpen ? block.color + "0C" : "transparent" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{block.icon}</span>
                <span className="text-sm font-semibold">{block.label}</span>
              </div>
              <ChevronDown size={16} className="transition-transform" style={{ color: isOpen ? block.color : "#7A7A7A", transform: isOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {isOpen && <div className="px-5 pb-5">{block.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
