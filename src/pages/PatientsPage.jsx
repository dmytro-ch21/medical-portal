import { useState, useEffect, useCallback } from "react";
import { patients as patientsApi } from "@/api/index.js";
import { Button } from "@/components/ui/button.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import { Input, Textarea, Label, Select } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { fmtDate, fmtShortDate, fmtTimeTo12h, todayISO, buildExcelRow, copyText } from "@/lib/utils.js";
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils.js";

const STATUSES = [
  { id: "lead",              label: "Лид",                     color: "#7A7A7A", bg: "#F0F0F0" },
  { id: "unresponsive",      label: "Не отвечает",             color: "#E67E22", bg: "#FFF3E0" },
  { id: "scheduled",        label: "Запись на консультацию",  color: "#1565C0", bg: "#E3F2FD" },
  { id: "completed",        label: "Консультация проведена",  color: "#2E7D32", bg: "#E8F5E9" },
  { id: "cancelled",        label: "Отмена",                  color: "#C62828", bg: "#FFEBEE" },
  { id: "waiting_list",     label: "Waiting List",            color: "#6A1B9A", bg: "#F3E5F5" },
  { id: "surgery_scheduled", label: "Операция запланирована", color: "#AD1457", bg: "#FCE4EC" },
  { id: "surgery_done",     label: "Операция проведена",      color: "#1B5E20", bg: "#E8F5E9" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]));

const PROCEDURES_LIST = [
  "Грудь", "Живот", "Липосакция", "BBL",
  "Подтяжка лица", "Brow lift", "Шея", "SMAS", "Deep Plane",
  "Блефаро (верхняя)", "Блефаро (нижняя)", "Нос", "Уши", "Mommy Makeover", "Другое",
];
const DOCTOR_LIST = ["Sergeev / Amid", "Oleg Zhelaev", "Diana", "Tamara", "Dr. Michael Keys", "Dr. Nilay Shah"];
const LEAD_SOURCES = ["Instagram", "Facebook", "Google", "TikTok", "Referral (friend)", "Referral (doctor)", "WhatsApp / Direct", "Другое"];
const LANGUAGES = ["Русский", "English", "Spanish", "Ukrainian", "Другой"];
const FORMATS = ["Онлайн", "Оффлайн", "Любой"];
const BUDGET_RANGES = ["Не указан", "< $3,000", "$3,000 – $7,000", "$7,000 – $15,000", "$15,000+", "Финансирование (Cherry)"];

function StatusBadge({ statusId }) {
  const s = STATUS_MAP[statusId] || STATUS_MAP.lead;
  return <Badge style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</Badge>;
}

function ExcelRowCopy({ patient: p }) {
  const [copied, setCopied] = useState(false);
  const row = buildExcelRow(p);
  const cells = row.split("\t");
  const handle = async (e) => {
    e.stopPropagation();
    await copyText(row);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 pt-3 border-t border-dashed border-portal-border flex items-center gap-2">
      <div className="flex-1 flex rounded-lg overflow-hidden border border-portal-border text-xs">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="px-2.5 py-1.5 font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
            style={{ backgroundColor: i % 2 === 0 ? "#F9F7F5" : "#FDFCFB", borderRight: i < cells.length - 1 ? "1px solid #E8E2DA" : "none", color: cell ? "#1A1A1A" : "#E8E2DA" }}
          >
            {cell || "—"}
          </div>
        ))}
      </div>
      <button
        onClick={handle}
        className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer flex-shrink-0 transition-colors", copied ? "border-green-400 bg-green-50 text-green-700" : "border-portal-border text-muted hover:border-accent")}
      >
        {copied ? <><Check size={11} /> Excel</> : <><Copy size={11} /> Excel</>}
      </button>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      const data = await patientsApi.list(params);
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  useEffect(() => { load(); }, [load]);

  const addPatient = async (data) => {
    const created = await patientsApi.create(data);
    setPatients(prev => [created, ...prev]);
  };

  const updatePatient = async (id, data) => {
    const updated = await patientsApi.update(id, data);
    setPatients(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Удалить пациента?")) return;
    await patientsApi.remove(id);
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const updateStatus = async (id, status) => {
    const p = patients.find(p => p.id === id);
    if (!p) return;
    await updatePatient(id, { ...normalizePatient(p), status });
  };

  return (
    <div>
      {modal && (
        <PatientModal
          patient={modal === "add" ? null : modal}
          onSave={modal === "add" ? addPatient : (data) => updatePatient(modal.id, data)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Пациенты</h1>
          <p className="text-sm text-muted mt-1">Всего записей: <strong className="text-[#1A1A1A]">{patients.length}</strong></p>
        </div>
        <Button onClick={() => setModal("add")}>
          <Plus size={14} /> Новый пациент
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-tag rounded-xl p-1 w-fit mb-5">
        {[{ id: "list", label: "Список пациентов" }, { id: "report", label: "Ежедневный отчёт" }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2 rounded-lg text-sm cursor-pointer transition-all", activeTab === tab.id ? "bg-white text-[#1A1A1A] font-semibold shadow-sm" : "text-muted")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "report" && <ReportView patients={patients} />}

      {activeTab === "list" && (
        <>
          {/* Filters */}
          <div className="flex gap-2.5 mb-5 flex-wrap items-center">
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-auto">
              <option value="all">Все статусы</option>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="px-3 py-2 rounded-lg border border-portal-border text-xs text-muted cursor-pointer hover:border-accent">
                × Сброс
              </button>
            )}
            <div className="ml-auto text-sm text-muted">Показано: <strong className="text-[#1A1A1A]">{patients.length}</strong></div>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-16 text-muted text-sm">Загрузка...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-base font-semibold text-[#1A1A1A] mb-1">Нет пациентов</div>
              <div className="text-sm">Нажмите «Новый пациент» чтобы добавить первую запись</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {patients.map(p => (
                <div key={p.id} className="bg-white border border-portal-border rounded-xl px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent text-base font-bold flex-shrink-0">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[15px] font-bold">{p.name}</span>
                        <StatusBadge statusId={p.status} />
                        {p.language && p.language !== "Русский" && (
                          <Badge style={{ backgroundColor: "#E3F2FD", color: "#1565C0" }}>{p.language}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2.5 flex-wrap text-xs text-muted mb-1">
                        <span>👨‍⚕️ {p.doctor || "—"}</span>
                        <span>·</span>
                        <span>🏥 {p.procedure || "—"}</span>
                        <span>·</span>
                        <span>📅 {fmtDate(p.consultation_date)}{p.consultation_time ? ` · ${fmtTimeTo12h(p.consultation_time)}` : ""}</span>
                        {(p.city || p.country) && <><span>·</span><span>📍 {[p.city, p.state, p.country].filter(Boolean).join(", ")}</span></>}
                      </div>
                      <div className="flex gap-2 flex-wrap text-xs text-muted">
                        {p.phone && <span>📞 {p.phone}</span>}
                        {p.email && <span>✉ {p.email}</span>}
                        {p.source && <span className="bg-tag px-2 py-0.5 rounded-full">from: {p.source}</span>}
                        {p.budget && p.budget !== "Не указан" && <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full font-semibold">💰 {p.budget}</span>}
                        {p.consult_format && <span className="bg-accent-light text-accent px-2 py-0.5 rounded-full">{p.consult_format}</span>}
                      </div>
                      {p.med_notes && (
                        <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-1.5">⚠ {p.med_notes}</div>
                      )}
                      {p.notes && (
                        <div className="mt-1.5 text-xs text-[#555] bg-portal-bg rounded-lg px-3 py-1.5">{p.notes}</div>
                      )}
                      <div className="text-[11px] text-muted mt-1.5">добавлен {fmtDate(p.created_at)}</div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Select
                        value={p.status}
                        onChange={e => updateStatus(p.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-auto text-xs py-1.5"
                      >
                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </Select>
                      <div className="flex gap-1.5">
                        <button onClick={() => setModal(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-portal-border text-xs text-muted cursor-pointer hover:border-accent hover:text-accent transition-colors">
                          <Pencil size={11} /> Изменить
                        </button>
                        <button onClick={() => deletePatient(p.id)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ExcelRowCopy patient={p} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function normalizePatient(p) {
  return {
    name: p.name,
    doctor: p.doctor,
    procedure: p.procedure,
    status: p.status,
    consultationDate: p.consultation_date || p.consultationDate,
    consultationTime: p.consultation_time || p.consultationTime,
    phone: p.phone,
    email: p.email,
    messenger: p.messenger,
    city: p.city,
    state: p.state,
    country: p.country,
    language: p.language,
    source: p.source,
    budget: p.budget,
    consultFormat: p.consult_format || p.consultFormat,
    dob: p.dob,
    prevSurgery: p.prev_surgery || p.prevSurgery,
    medNotes: p.med_notes || p.medNotes,
    notes: p.notes,
  };
}

function PatientModal({ patient, onSave, onClose }) {
  const p = patient || {};
  const [name, setName] = useState(p.name || "");
  const [doctor, setDoctor] = useState(p.doctor || "");
  const [procedure, setProc] = useState(p.procedure || "");
  const [status, setStatus] = useState(p.status || "lead");
  const [date, setDate] = useState(p.consultation_date || p.consultationDate || todayISO());
  const [time, setTime] = useState(p.consultation_time || p.consultationTime || "");
  const [phone, setPhone] = useState(p.phone || "");
  const [email, setEmail] = useState(p.email || "");
  const [messenger, setMessenger] = useState(p.messenger || "WhatsApp");
  const [city, setCity] = useState(p.city || "");
  const [state, setState2] = useState(p.state || "");
  const [country, setCountry] = useState(p.country || "USA");
  const [language, setLanguage] = useState(p.language || "Русский");
  const [source, setSource] = useState(p.source || "");
  const [budget, setBudget] = useState(p.budget || "Не указан");
  const [format, setFormat] = useState(p.consult_format || p.consultFormat || "Онлайн");
  const [dob, setDob] = useState(p.dob || "");
  const [prevSurgery, setPrev] = useState(p.prev_surgery || p.prevSurgery || "");
  const [medNotes, setMed] = useState(p.med_notes || p.medNotes || "");
  const [notes, setNotes] = useState(p.notes || "");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return setErr("Введите имя пациента");
    if (!doctor) return setErr("Выберите специалиста");
    if (!procedure) return setErr("Выберите процедуру");
    setLoading(true);
    try {
      await onSave({
        name: name.trim(), doctor, procedure, status,
        consultationDate: date, consultationTime: time,
        phone: phone.trim(), email: email.trim(), messenger,
        city: city.trim(), state: state.trim(), country: country.trim(),
        language, source, budget, consultFormat: format,
        dob, prevSurgery: prevSurgery.trim(), medNotes: medNotes.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ children }) => <div className="grid grid-cols-2 gap-3 mb-4">{children}</div>;
  const Field = ({ label, children }) => <div><Label>{label}</Label>{children}</div>;
  const Sep = ({ children }) => <div className="text-[10px] font-bold uppercase tracking-widest text-accent py-2 mt-1 border-t border-portal-border">{children}</div>;

  return (
    <Dialog open={true} onClose={onClose} title={patient ? "Редактировать пациента" : "Новый пациент"}>
      <Sep>Основное</Sep>
      <div className="mb-4"><Label>Имя пациента *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Имя и Фамилия" /></div>
      <Row>
        <Field label="Специалист *">
          <Select value={doctor} onChange={e => setDoctor(e.target.value)}>
            <option value="">Выберите...</option>
            {DOCTOR_LIST.map(d => <option key={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Процедура *">
          <Select value={procedure} onChange={e => setProc(e.target.value)}>
            <option value="">Выберите...</option>
            {PROCEDURES_LIST.map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Статус"><Select value={status} onChange={e => setStatus(e.target.value)}>{STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></Field>
        <Field label="Формат"><Select value={format} onChange={e => setFormat(e.target.value)}>{FORMATS.map(f => <option key={f}>{f}</option>)}</Select></Field>
      </Row>
      <Row>
        <Field label="Дата консультации"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Время"><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
      </Row>

      <Sep>Контакты</Sep>
      <Row>
        <Field label="Телефон"><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (305) 555-0000" /></Field>
        <Field label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></Field>
      </Row>
      <Row>
        <Field label="Мессенджер"><Input value={messenger} onChange={e => setMessenger(e.target.value)} placeholder="WhatsApp" /></Field>
        <Field label="Язык"><Select value={language} onChange={e => setLanguage(e.target.value)}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</Select></Field>
      </Row>

      <Sep>Местоположение</Sep>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Field label="Город"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Miami" /></Field>
        <Field label="Штат"><Input value={state} onChange={e => setState2(e.target.value)} placeholder="FL" /></Field>
        <Field label="Страна"><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="USA" /></Field>
      </div>

      <Sep>Дополнительно</Sep>
      <Row>
        <Field label="Источник"><Select value={source} onChange={e => setSource(e.target.value)}><option value="">Не указан</option>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Бюджет"><Select value={budget} onChange={e => setBudget(e.target.value)}>{BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}</Select></Field>
      </Row>
      <Row>
        <Field label="Дата рождения"><Input type="date" value={dob} onChange={e => setDob(e.target.value)} /></Field>
        <Field label="Предыдущие операции"><Input value={prevSurgery} onChange={e => setPrev(e.target.value)} placeholder="Нет" /></Field>
      </Row>

      <Sep>Заметки</Sep>
      <div className="mb-3"><Label>Медицинские ограничения</Label><Textarea rows={2} value={medNotes} onChange={e => setMed(e.target.value)} placeholder="Беременность, ГВ и т.д." /></div>
      <div className="mb-4"><Label>Общие заметки</Label><Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Любые дополнительные заметки..." /></div>

      {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">⚠ {err}</div>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Отмена</Button>
        <Button onClick={submit} disabled={loading}>{loading ? "Сохранение..." : patient ? "Сохранить" : "Добавить"}</Button>
      </div>
    </Dialog>
  );
}

function ReportView({ patients }) {
  const [date, setDate] = useState(todayISO());
  const [schedulerName, setName] = useState("Olga");
  const [copied, setCopied] = useState(false);

  const onDate = (p, field) => (p[field] || "").slice(0, 10) === date;
  const leadsToday = patients.filter(p => (p.created_at || "").slice(0, 10) === date);
  const unresponsive = leadsToday.filter(p => p.status === "unresponsive");
  const scheduled = patients.filter(p => onDate(p, "consultation_date") && p.status === "scheduled");
  const completed = patients.filter(p => onDate(p, "consultation_date") && p.status === "completed");
  const cancelled = patients.filter(p => onDate(p, "consultation_date") && p.status === "cancelled");
  const surgSched = patients.filter(p => onDate(p, "consultation_date") && p.status === "surgery_scheduled");
  const surgDone = patients.filter(p => onDate(p, "consultation_date") && p.status === "surgery_done");

  const d = new Date(date + "T12:00:00");
  const dateFormatted = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const cancelNote = cancelled.length > 0 ? ` (${cancelled.length} отмена)` : "";
  const ascii = [
    `Daily Report: ${schedulerName} (schedule)`,
    `Date: ${dateFormatted}`,
    `Total Leads for the Day: ${leadsToday.length}`,
    `Unresponsive Leads: ${unresponsive.length}`,
    `Scheduled Consultations: ${scheduled.length}`,
    `Completed Consultations: ${completed.length}${cancelNote}`,
    `Scheduled Surgeries: ${surgSched.length}`,
    `Surgeries Performed: ${surgDone.length}`,
  ].join("\n");

  const copyReport = async () => {
    await copyText(ascii);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: "Лидов за день", value: leadsToday.length, color: "#1565C0", bg: "#E3F2FD", icon: "📥" },
    { label: "Не отвечают", value: unresponsive.length, color: "#E67E22", bg: "#FFF3E0", icon: "📵" },
    { label: "Записи на консультацию", value: scheduled.length, color: "#6A1B9A", bg: "#F3E5F5", icon: "📅" },
    { label: "Консультации проведены", value: completed.length, color: "#2E7D32", bg: "#E8F5E9", icon: "✅" },
    { label: "Отмены", value: cancelled.length, color: "#C62828", bg: "#FFEBEE", icon: "❌" },
    { label: "Операции запланированы", value: surgSched.length, color: "#AD1457", bg: "#FCE4EC", icon: "🗓️" },
    { label: "Операции проведены", value: surgDone.length, color: "#1B5E20", bg: "#E8F5E9", icon: "🏥" },
  ];

  return (
    <div>
      <div className="flex gap-4 mb-6 flex-wrap items-end">
        <div><Label>Дата отчёта</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" /></div>
        <div><Label>Имя планировщика</Label><Input value={schedulerName} onChange={e => setName(e.target.value)} placeholder="Olga" className="w-40" /></div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-xl px-4 py-4" style={{ backgroundColor: card.bg, border: `1px solid ${card.color}30` }}>
            <div className="text-xl mb-1.5">{card.icon}</div>
            <div className="text-3xl font-extrabold leading-none mb-1.5" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs font-medium leading-tight" style={{ color: card.color }}>{card.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-portal-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-portal-border bg-portal-bg">
          <span className="text-sm font-semibold">Отчёт для копирования</span>
          <button
            onClick={copyReport}
            className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors", copied ? "border-green-400 bg-green-50 text-green-700" : "border-accent bg-accent-light text-accent hover:bg-accent hover:text-white")}
          >
            {copied ? <><Check size={12} /> Скопировано</> : <><Copy size={12} /> Скопировать отчёт</>}
          </button>
        </div>
        <pre className="m-0 px-6 py-5 text-sm leading-loose text-[#1A1A1A] font-mono whitespace-pre-wrap">
          {ascii}
        </pre>
      </div>
    </div>
  );
}
