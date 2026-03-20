import { useState, useEffect } from "react";
import { users as usersApi, scripts as scriptsApi, checklist as checklistApi, content as contentApi } from "@/api/index.js";
import { Button } from "@/components/ui/button.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import { Input, Textarea, Label, Select } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, Save } from "lucide-react";
import { cn } from "@/lib/utils.js";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TABS = [
  { id: "users",       label: "Пользователи" },
  { id: "scripts",     label: "Скрипты" },
  { id: "checklist",   label: "Чек-лист" },
  { id: "specialists", label: "Специалисты" },
  { id: "clinic",      label: "Клиника" },
  { id: "prices",      label: "Цены" },
  { id: "reference",   label: "Справочник" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Администрация</h1>
      <p className="text-sm text-muted mb-5">Управление пользователями и контентом</p>

      <div className="flex flex-wrap gap-1 bg-tag rounded-xl p-1 w-fit mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2 rounded-lg text-sm cursor-pointer transition-all whitespace-nowrap", activeTab === tab.id ? "bg-white text-[#1A1A1A] font-semibold shadow-sm" : "text-muted")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users"       && <UsersTab />}
      {activeTab === "scripts"     && <ScriptsTab />}
      {activeTab === "checklist"   && <ChecklistTab />}
      {activeTab === "specialists" && <SpecialistsTab />}
      {activeTab === "clinic"      && <ClinicTab />}
      {activeTab === "prices"      && <PricesTab />}
      {activeTab === "reference"   && <ReferenceTab />}
    </div>
  );
}

// ── Saved notice ──────────────────────────────────────────────────────────────
function SavedNotice({ show }) {
  if (!show) return null;
  return <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">✓ Сохранено</div>;
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => { usersApi.list().then(setUsers); }, []);

  const toggleActive = async (u) => {
    const updated = await usersApi.update(u.id, { is_active: !u.is_active });
    setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
  };

  const onSaved = (u) => {
    setUsers(prev => prev.find(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [...prev, u]);
    setModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted">{users.length} пользователей</span>
        <Button size="sm" onClick={() => { setEditUser(null); setModal(true); }}>
          <Plus size={13} /> Добавить
        </Button>
      </div>
      {modal && <UserModal user={editUser} onClose={() => setModal(false)} onSave={onSaved} />}
      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div key={u.id} className="bg-white border border-portal-border rounded-xl px-5 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
              {(u.display_name || u.username)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{u.display_name || u.username}</div>
              <div className="text-xs text-muted">@{u.username}</div>
            </div>
            <Badge style={{ backgroundColor: u.role === "admin" ? "#F5EDE3" : "#E3F2FD", color: u.role === "admin" ? "#9E7250" : "#1565C0" }}>{u.role}</Badge>
            <Badge style={{ backgroundColor: u.is_active ? "#E8F5E9" : "#F0F0F0", color: u.is_active ? "#2E7D32" : "#7A7A7A" }}>{u.is_active ? "Активен" : "Неактивен"}</Badge>
            <div className="flex gap-1.5">
              <button onClick={() => { setEditUser(u); setModal(true); }} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light cursor-pointer transition-colors"><Pencil size={13} /></button>
              <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light cursor-pointer transition-colors">{u.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [username, setUsername] = useState(user?.username || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [role, setRole] = useState(user?.role || "coordinator");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user && (!username || !password)) return setErr("Укажите логин и пароль");
    setLoading(true);
    try {
      const body = user ? { display_name: displayName, role, ...(password ? { password } : {}) }
                        : { username, password, role, display_name: displayName || username };
      const result = user ? await usersApi.update(user.id, body) : await usersApi.create(body);
      onSave(result);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={true} onClose={onClose} title={user ? "Редактировать пользователя" : "Новый пользователь"}>
      <div className="space-y-4">
        {!user && <div><Label>Логин *</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" /></div>}
        <div><Label>Отображаемое имя</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Olga K." /></div>
        <div><Label>Роль</Label><Select value={role} onChange={e => setRole(e.target.value)}><option value="coordinator">Coordinator</option><option value="admin">Admin</option></Select></div>
        <div><Label>{user ? "Новый пароль (оставьте пустым)" : "Пароль *"}</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
        {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠ {err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "..." : user ? "Сохранить" : "Создать"}</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Scripts Tab ───────────────────────────────────────────────────────────────
function SortableScriptRow({ s, index, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.12)" : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-portal-border rounded-xl px-4 py-3 flex items-center gap-3">
      <button {...attributes} {...listeners} className="p-1 rounded text-[#bbb] hover:text-muted cursor-grab active:cursor-grabbing flex-shrink-0" tabIndex={-1}>
        <GripVertical size={15} />
      </button>
      <div className="w-7 h-7 rounded-lg bg-accent-light text-accent text-[11px] font-bold flex items-center justify-center flex-shrink-0">{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{s.title}</div>
        <div className="text-xs text-muted">{s.category}</div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => onEdit(s)} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light cursor-pointer"><Pencil size={13} /></button>
        <button onClick={() => onDelete(s.id)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function ScriptsTab() {
  const [scripts, setScripts] = useState([]);
  const [modal, setModal] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { scriptsApi.list().then(setScripts); }, []);

  const del = async (id) => {
    if (!window.confirm("Удалить скрипт?")) return;
    await scriptsApi.remove(id);
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const onSaved = (s) => {
    setScripts(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [...prev, s]);
    setModal(null);
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = scripts.findIndex(s => s.id === active.id);
    const newIdx = scripts.findIndex(s => s.id === over.id);
    const reordered = arrayMove(scripts, oldIdx, newIdx);
    setScripts(reordered);
    await scriptsApi.reorder(reordered.map(s => s.id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted">{scripts.length} скриптов</span>
        <Button size="sm" onClick={() => setModal({})}><Plus size={13} /> Добавить</Button>
      </div>
      {modal !== null && <ScriptModal script={modal.id ? modal : null} onClose={() => setModal(null)} onSave={onSaved} existingCats={[...new Set(scripts.map(s => s.category))]} />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={scripts.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {scripts.map((s, i) => (
              <SortableScriptRow key={s.id} s={s} index={i} onEdit={setModal} onDelete={del} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ScriptModal({ script, onClose, onSave, existingCats }) {
  const [step, setStep] = useState(script?.step || "");
  const [title, setTitle] = useState(script?.title || "");
  const [category, setCategory] = useState(script?.category || "");
  const [text, setText] = useState(script?.text || "");
  const [newCat, setNewCat] = useState("");
  const [useNew, setUseNew] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const finalCat = useNew ? newCat.trim() : category;

  const submit = async () => {
    if (!title.trim() || !text.trim() || !finalCat) return setErr("Заполните все поля");
    setLoading(true);
    try {
      const result = script?.id
        ? await scriptsApi.update(script.id, { step, title, category: finalCat, text })
        : await scriptsApi.create({ step, title, category: finalCat, text });
      onSave(result);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={true} onClose={onClose} title={script?.id ? "Редактировать скрипт" : "Новый скрипт"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Шаг</Label><Input value={step} onChange={e => setStep(e.target.value)} placeholder="01" /></div>
          <div>
            <Label>Категория *</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {existingCats.map(c => (
                <button key={c} onClick={() => { setCategory(c); setUseNew(false); }} className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border", !useNew && category === c ? "border-accent bg-accent-light text-accent" : "border-portal-border text-muted")}>{c}</button>
              ))}
              <button onClick={() => setUseNew(true)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border", useNew ? "border-accent bg-accent-light text-accent" : "border-portal-border text-muted")}>+ Новая</button>
            </div>
            {useNew && <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Название категории" />}
          </div>
        </div>
        <div><Label>Название *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div><Label>Текст *</Label><Textarea rows={7} value={text} onChange={e => setText(e.target.value)} /></div>
        {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠ {err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "..." : "Сохранить"}</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Checklist Tab ─────────────────────────────────────────────────────────────
function ChecklistTab() {
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [editItem, setEditItem] = useState(null); // {id, text}
  const [adding, setAdding] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionIcon, setNewSectionIcon] = useState("📋");
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    checklistApi.list().then(data => {
      setSections(data);
      if (data.length > 0) setActiveSection(data[0].id);
    });
  }, []);

  const current = sections.find(s => s.id === activeSection);

  const addItem = async () => {
    if (!newItemText.trim() || !activeSection) return;
    setAdding(true);
    try {
      const item = await checklistApi.createItem(activeSection, { text: newItemText.trim() });
      setSections(prev => prev.map(s => s.id === activeSection ? { ...s, items: [...s.items, item] } : s));
      setNewItemText("");
    } finally { setAdding(false); }
  };

  const saveItem = async (id, text) => {
    const updated = await checklistApi.updateItem(id, { text });
    setSections(prev => prev.map(s => ({ ...s, items: s.items.map(i => i.id === id ? updated : i) })));
    setEditItem(null);
  };

  const delItem = async (sectionId, itemId) => {
    await checklistApi.deleteItem(itemId);
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s));
  };

  const addSection = async () => {
    if (!newSectionLabel.trim()) return;
    setAddingSection(true);
    const id = newSectionLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    try {
      const sec = await checklistApi.createSection({ id, icon: newSectionIcon, label: newSectionLabel.trim(), color: "#C4956A" });
      setSections(prev => [...prev, { ...sec, items: [] }]);
      setNewSectionLabel(""); setNewSectionIcon("📋");
    } finally { setAddingSection(false); }
  };

  const delSection = async (id) => {
    if (!window.confirm("Удалить раздел со всеми пунктами?")) return;
    await checklistApi.deleteSection(id);
    setSections(prev => prev.filter(s => s.id !== id));
    if (activeSection === id) setActiveSection(sections[0]?.id);
  };

  return (
    <div className="flex gap-5">
      <div className="w-52 flex-shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 px-1">Разделы</div>
        {sections.map(s => (
          <div key={s.id} className="flex items-center gap-1 mb-1">
            <button
              onClick={() => setActiveSection(s.id)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
              style={{ backgroundColor: activeSection === s.id ? s.color + "18" : "transparent", border: `1px solid ${activeSection === s.id ? s.color + "60" : "transparent"}` }}
            >
              <span className="text-sm">{s.icon}</span>
              <span className="text-xs truncate" style={{ fontWeight: activeSection === s.id ? 600 : 400, color: activeSection === s.id ? "#1A1A1A" : "#7A7A7A" }}>{s.label}</span>
            </button>
            <button onClick={() => delSection(s.id)} className="p-1 rounded text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={11} /></button>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-portal-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Новый раздел</div>
          <div className="flex gap-1.5 mb-1.5">
            <Input value={newSectionIcon} onChange={e => setNewSectionIcon(e.target.value)} className="w-12 text-center px-1" placeholder="📋" />
            <Input value={newSectionLabel} onChange={e => setNewSectionLabel(e.target.value)} placeholder="Название..." onKeyDown={e => e.key === "Enter" && addSection()} />
          </div>
          <Button size="sm" className="w-full" onClick={addSection} disabled={addingSection}>Добавить</Button>
        </div>
      </div>

      {current && (
        <div className="flex-1">
          <div className="text-sm font-semibold mb-3">{current.icon} {current.label}</div>
          <div className="bg-white border border-portal-border rounded-xl overflow-hidden mb-3">
            {current.items.map((item, idx) => (
              <div key={item.id} className={cn("flex items-center gap-3 px-4 py-2.5", idx < current.items.length - 1 ? "border-b border-portal-border" : "")}>
                {editItem?.id === item.id ? (
                  <>
                    <Input value={editItem.text} onChange={e => setEditItem(x => ({ ...x, text: e.target.value }))} className="flex-1 h-7 text-xs" autoFocus onKeyDown={e => { if (e.key === "Enter") saveItem(item.id, editItem.text); if (e.key === "Escape") setEditItem(null); }} />
                    <button onClick={() => saveItem(item.id, editItem.text)} className="p-1 rounded text-accent cursor-pointer"><Save size={12} /></button>
                    <button onClick={() => setEditItem(null)} className="p-1 rounded text-muted cursor-pointer">✕</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1">{item.subgroup && <span className="text-[10px] text-muted mr-1">{item.subgroup} ·</span>}{item.text}</span>
                    <button onClick={() => setEditItem({ id: item.id, text: item.text })} className="p-1 rounded text-muted hover:text-accent cursor-pointer"><Pencil size={11} /></button>
                    <button onClick={() => delItem(current.id, item.id)} className="p-1 rounded text-muted hover:text-red-500 cursor-pointer"><Trash2 size={11} /></button>
                  </>
                )}
              </div>
            ))}
            {current.items.length === 0 && <div className="text-sm text-muted px-4 py-4">Нет пунктов</div>}
          </div>
          <div className="flex gap-2">
            <Input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Новый пункт..." onKeyDown={e => e.key === "Enter" && addItem()} />
            <Button onClick={addItem} disabled={adding} size="sm">Добавить</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Specialists Tab ───────────────────────────────────────────────────────────
const NOTE_TYPES = ["warning", "info", "success", "danger", "clinic"];
const FORMATS = ["Онлайн", "Оффлайн"];

function SpecialistsTab() {
  const [data, setData] = useState({ specialists: [], coordRules: [] });
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState(null);
  const [ruleModal, setRuleModal] = useState(null);

  useEffect(() => {
    Promise.all([contentApi.get("specialists"), contentApi.get("coord_rules")])
      .then(([s, r]) => setData({ specialists: s, coordRules: r }));
  }, []);

  const save = async (key, value) => {
    await contentApi.set(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveSpecialists = (list) => { setData(d => ({ ...d, specialists: list })); save("specialists", list); };
  const saveRules = (list) => { setData(d => ({ ...d, coordRules: list })); save("coord_rules", list); };

  const delSpec = (i) => saveSpecialists(data.specialists.filter((_, j) => j !== i));
  const saveSpec = (sp, i) => {
    const list = i === -1 ? [...data.specialists, sp] : data.specialists.map((s, j) => j === i ? sp : s);
    saveSpecialists(list);
    setModal(null);
  };

  const delRule = (i) => saveRules(data.coordRules.filter((_, j) => j !== i));
  const saveRule = (r, i) => {
    const list = i === -1 ? [...data.coordRules, r] : data.coordRules.map((x, j) => j === i ? r : x);
    saveRules(list);
    setRuleModal(null);
  };

  return (
    <div>
      <SavedNotice show={saved} />

      {modal !== null && <SpecialistModal specialist={modal.sp} idx={modal.i} onClose={() => setModal(null)} onSave={saveSpec} />}
      {ruleModal !== null && <RuleModal rule={ruleModal.r} idx={ruleModal.i} onClose={() => setRuleModal(null)} onSave={saveRule} />}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Правила координаторов</div>
          <Button size="sm" onClick={() => setRuleModal({ r: null, i: -1 })}><Plus size={12} /> Добавить</Button>
        </div>
        {data.coordRules.map((r, i) => (
          <div key={i} className="flex gap-3 bg-white border border-portal-border rounded-xl px-4 py-3 mb-2 items-start" style={{ borderLeft: `3px solid ${r.color || "#E74C3C"}` }}>
            <span className="text-lg">{r.icon}</span>
            <span className="flex-1 text-sm">{r.text}</span>
            <div className="flex gap-1">
              <button onClick={() => setRuleModal({ r, i })} className="p-1 rounded text-muted hover:text-accent cursor-pointer"><Pencil size={12} /></button>
              <button onClick={() => delRule(i)} className="p-1 rounded text-muted hover:text-red-500 cursor-pointer"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Специалисты</div>
          <Button size="sm" onClick={() => setModal({ sp: null, i: -1 })}><Plus size={12} /> Добавить</Button>
        </div>
        {data.specialists.map((sp, i) => (
          <div key={i} className="bg-white border border-portal-border rounded-xl px-5 py-3.5 mb-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{sp.name}</div>
              <div className="text-xs text-muted">{sp.days} · {sp.time} · {sp.format}</div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setModal({ sp, i })} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light cursor-pointer"><Pencil size={13} /></button>
              <button onClick={() => delSpec(i)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecialistModal({ specialist: sp, idx, onClose, onSave }) {
  const [name, setName] = useState(sp?.name || "");
  const [days, setDays] = useState(sp?.days || "");
  const [time, setTime] = useState(sp?.time || "");
  const [format, setFormat] = useState(sp?.format || "Онлайн");
  const [note, setNote] = useState(sp?.note || "");
  const [noteType, setNoteType] = useState(sp?.noteType || "info");
  const [does, setDoes] = useState((sp?.does || []).join(", "));
  const [doesNot, setDoesNot] = useState((sp?.doesNot || []).join(", "));

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(), days, time, format, note, noteType,
      does: does.split(",").map(s => s.trim()).filter(Boolean),
      doesNot: doesNot.split(",").map(s => s.trim()).filter(Boolean),
    }, idx);
  };

  return (
    <Dialog open={true} onClose={onClose} title={idx === -1 ? "Новый специалист" : "Редактировать специалиста"}>
      <div className="space-y-3">
        <div><Label>Имя *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Дни</Label><Input value={days} onChange={e => setDays(e.target.value)} placeholder="Пн / Ср / Пт" /></div>
          <div><Label>Время</Label><Input value={time} onChange={e => setTime(e.target.value)} placeholder="12:00 – 2:15 PM" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Формат</Label><Select value={format} onChange={e => setFormat(e.target.value)}>{FORMATS.map(f => <option key={f}>{f}</option>)}</Select></div>
          <div><Label>Тип пометки</Label><Select value={noteType} onChange={e => setNoteType(e.target.value)}>{NOTE_TYPES.map(t => <option key={t}>{t}</option>)}</Select></div>
        </div>
        <div><Label>Пометка</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Только BODY" /></div>
        <div><Label>Делает (через запятую)</Label><Input value={does} onChange={e => setDoes(e.target.value)} placeholder="Тело, Грудь, Живот" /></div>
        <div><Label>Не делает (через запятую)</Label><Input value={doesNot} onChange={e => setDoesNot(e.target.value)} placeholder="Лицо, Подтяжка" /></div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={submit}>Сохранить</Button>
        </div>
      </div>
    </Dialog>
  );
}

function RuleModal({ rule, idx, onClose, onSave }) {
  const [icon, setIcon] = useState(rule?.icon || "⚡");
  const [color, setColor] = useState(rule?.color || "#E74C3C");
  const [text, setText] = useState(rule?.text || "");

  return (
    <Dialog open={true} onClose={onClose} title={idx === -1 ? "Новое правило" : "Редактировать правило"}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Иконка</Label><Input value={icon} onChange={e => setIcon(e.target.value)} /></div>
          <div><Label>Цвет (hex)</Label><Input value={color} onChange={e => setColor(e.target.value)} placeholder="#E74C3C" /></div>
        </div>
        <div><Label>Текст *</Label><Textarea rows={3} value={text} onChange={e => setText(e.target.value)} /></div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => { if (text.trim()) onSave({ icon, color, text: text.trim() }, idx); }}>Сохранить</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Clinic Tab ────────────────────────────────────────────────────────────────
function ClinicTab() {
  const [clinic, setClinic] = useState(null);
  const [saved, setSaved] = useState(false);
  const [docModal, setDocModal] = useState(null);

  useEffect(() => { contentApi.get("clinic").then(setClinic); }, []);

  const save = async (data) => {
    await contentApi.set("clinic", data);
    setClinic(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!clinic) return <div className="text-sm text-muted">Загрузка...</div>;

  const saveDoc = (doc, i) => {
    const docs = i === -1 ? [...clinic.doctors, doc] : clinic.doctors.map((d, j) => j === i ? doc : d);
    save({ ...clinic, doctors: docs });
    setDocModal(null);
  };
  const delDoc = (i) => save({ ...clinic, doctors: clinic.doctors.filter((_, j) => j !== i) });

  const field = (label, val, key) => (
    <div className="mb-3">
      <Label>{label}</Label>
      <Input value={val || ""} onChange={e => setClinic(c => ({ ...c, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div>
      <SavedNotice show={saved} />
      {docModal !== null && <DoctorModal doctor={docModal.d} idx={docModal.i} onClose={() => setDocModal(null)} onSave={saveDoc} />}

      <div className="bg-white border border-portal-border rounded-xl p-5 mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Информация о клинике</div>
        {field("Название", clinic.name, "name")}
        {field("Адрес", clinic.address, "address")}
        {field("Instagram", clinic.instagram, "instagram")}
        {field("Сайт", clinic.website, "website")}
        {field("Импланты", clinic.implants, "implants")}
        <Button onClick={() => save(clinic)}><Save size={13} /> Сохранить</Button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-accent">Врачи</div>
          <Button size="sm" onClick={() => setDocModal({ d: null, i: -1 })}><Plus size={12} /> Добавить</Button>
        </div>
        {clinic.doctors.map((doc, i) => (
          <div key={i} className="bg-white border border-portal-border rounded-xl px-5 py-3.5 mb-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{doc.name}</div>
              <div className="text-xs text-accent">{doc.spec}</div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setDocModal({ d: doc, i })} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light cursor-pointer"><Pencil size={13} /></button>
              <button onClick={() => delDoc(i)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorModal({ doctor: d, idx, onClose, onSave }) {
  const [name, setName] = useState(d?.name || "");
  const [spec, setSpec] = useState(d?.spec || "");
  const [desc, setDesc] = useState(d?.desc || "");
  const [link, setLink] = useState(d?.link || "");

  return (
    <Dialog open={true} onClose={onClose} title={idx === -1 ? "Новый врач" : "Редактировать врача"}>
      <div className="space-y-3">
        <div><Label>Имя *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label>Специализация</Label><Input value={spec} onChange={e => setSpec(e.target.value)} /></div>
        <div><Label>Описание</Label><Textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} /></div>
        <div><Label>Ссылка (профиль)</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." /></div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => { if (name.trim()) onSave({ name: name.trim(), spec, desc, link }, idx); }}>Сохранить</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Prices Tab ────────────────────────────────────────────────────────────────
function PricesTab() {
  const [prices, setPrices] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { contentApi.get("prices").then(setPrices); }, []);

  const save = async (data) => {
    await contentApi.set("prices", data);
    setPrices(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!prices) return <div className="text-sm text-muted">Загрузка...</div>;

  const updateItem = (si, ii, key, val) => {
    const sections = prices.sections.map((s, x) =>
      x !== si ? s : { ...s, items: s.items.map((item, y) => y !== ii ? item : { ...item, [key]: val }) }
    );
    setPrices(p => ({ ...p, sections }));
  };

  const addItem = (si) => {
    const sections = prices.sections.map((s, x) => x !== si ? s : { ...s, items: [...s.items, { name: "", price: "" }] });
    setPrices(p => ({ ...p, sections }));
  };

  const delItem = (si, ii) => {
    const sections = prices.sections.map((s, x) => x !== si ? s : { ...s, items: s.items.filter((_, y) => y !== ii) });
    setPrices(p => ({ ...p, sections }));
  };

  const addSection = () => setPrices(p => ({ ...p, sections: [...p.sections, { title: "Новый раздел", items: [] }] }));
  const delSection = (si) => setPrices(p => ({ ...p, sections: p.sections.filter((_, x) => x !== si) }));
  const updateSectionTitle = (si, val) => setPrices(p => ({ ...p, sections: p.sections.map((s, x) => x !== si ? s : { ...s, title: val }) }));

  return (
    <div>
      <SavedNotice show={saved} />

      {prices.sections.map((section, si) => (
        <div key={si} className="bg-white border border-portal-border rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Input value={section.title} onChange={e => updateSectionTitle(si, e.target.value)} className="font-semibold text-sm" />
            <button onClick={() => delSection(si)} className="p-1.5 rounded-lg text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
          </div>
          {section.items.map((item, ii) => (
            <div key={ii} className="flex gap-2 mb-2 items-center">
              <Input value={item.name} onChange={e => updateItem(si, ii, "name", e.target.value)} placeholder="Название процедуры" className="flex-1" />
              <Input value={item.price} onChange={e => updateItem(si, ii, "price", e.target.value)} placeholder="$3,000" className="w-36" />
              <button onClick={() => delItem(si, ii)} className="p-1.5 rounded-lg text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addItem(si)} className="mt-1"><Plus size={12} /> Позиция</Button>
        </div>
      ))}

      <Button size="sm" variant="outline" onClick={addSection} className="mb-5"><Plus size={12} /> Раздел цен</Button>

      <div className="bg-white border border-portal-border rounded-xl p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Заметка под прайсом</div>
        <Textarea rows={2} value={prices.note || ""} onChange={e => setPrices(p => ({ ...p, note: e.target.value }))} />
      </div>

      <div className="bg-white border border-portal-border rounded-xl p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-3">Рассрочка (Cherry)</div>
        <Textarea rows={3} value={prices.financing || ""} onChange={e => setPrices(p => ({ ...p, financing: e.target.value }))} />
      </div>

      <Button onClick={() => save(prices)}><Save size={13} /> Сохранить все изменения</Button>
    </div>
  );
}

// ── Reference Tab ─────────────────────────────────────────────────────────────
function ReferenceTab() {
  const [ref, setRef] = useState(null);
  const [saved, setSaved] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newStep, setNewStep] = useState("");

  useEffect(() => { contentApi.get("reference").then(setRef); }, []);

  const save = async (data) => {
    await contentApi.set("reference", data);
    setRef(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!ref) return <div className="text-sm text-muted">Загрузка...</div>;

  const updateListItem = (key, i, val) => setRef(r => ({ ...r, [key]: r[key].map((x, j) => j === i ? val : x) }));
  const delListItem = (key, i) => setRef(r => ({ ...r, [key]: r[key].filter((_, j) => j !== i) }));
  const addListItem = (key, val) => { if (!val.trim()) return; setRef(r => ({ ...r, [key]: [...(r[key] || []), val.trim()] })); };

  const updateRule = (i, field, val) => setRef(r => ({ ...r, rules: r.rules.map((x, j) => j === i ? { ...x, [field]: val } : x) }));
  const delRule = (i) => setRef(r => ({ ...r, rules: r.rules.filter((_, j) => j !== i) }));
  const addRule = () => {
    if (!newRule.trim()) return;
    setRef(r => ({ ...r, rules: [...r.rules, { text: newRule.trim(), icon: "✅" }] }));
    setNewRule("");
  };

  return (
    <div>
      <SavedNotice show={saved} />

      {/* Rules */}
      <div className="bg-white border border-portal-border rounded-xl p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Основные правила</div>
        {ref.rules.map((r, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <Input value={r.icon} onChange={e => updateRule(i, "icon", e.target.value)} className="w-12 text-center px-1" />
            <Input value={r.text} onChange={e => updateRule(i, "text", e.target.value)} className="flex-1" />
            <button onClick={() => delRule(i)} className="p-1.5 rounded-lg text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Новое правило..." onKeyDown={e => e.key === "Enter" && addRule()} />
          <Button size="sm" onClick={addRule}><Plus size={12} /></Button>
        </div>
      </div>

      {/* Algorithm */}
      <div className="bg-white border border-portal-border rounded-xl p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Алгоритм (шаги)</div>
        {ref.algorithm.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <div className="w-6 text-xs font-bold text-accent flex-shrink-0 text-center">{i + 1}.</div>
            <Input value={step} onChange={e => updateListItem("algorithm", i, e.target.value)} className="flex-1" />
            <button onClick={() => delListItem("algorithm", i)} className="p-1.5 rounded-lg text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Новый шаг..." onKeyDown={e => { if (e.key === "Enter") { addListItem("algorithm", newStep); setNewStep(""); } }} />
          <Button size="sm" onClick={() => { addListItem("algorithm", newStep); setNewStep(""); }}><Plus size={12} /></Button>
        </div>
      </div>

      {/* Key phrases */}
      <div className="bg-white border border-portal-border rounded-xl p-5 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent mb-4">Ключевые фразы</div>
        {ref.keyPhrases.map((phrase, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <Textarea value={phrase} onChange={e => updateListItem("keyPhrases", i, e.target.value)} rows={1} className="flex-1" />
            <button onClick={() => delListItem("keyPhrases", i)} className="p-1.5 rounded-lg text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} placeholder="Новая фраза..." onKeyDown={e => { if (e.key === "Enter") { addListItem("keyPhrases", newPhrase); setNewPhrase(""); } }} />
          <Button size="sm" onClick={() => { addListItem("keyPhrases", newPhrase); setNewPhrase(""); }}><Plus size={12} /></Button>
        </div>
      </div>

      {/* Procedure lists */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[["bodyProcedures", "Процедуры тела (Body)"], ["faceProcedures", "Процедуры лица (Face)"], ["freeConsult", "Бесплатная консультация"], ["paidConsult", "Платная консультация ($50)"]].map(([key, label]) => (
          <div key={key} className="bg-white border border-portal-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3">{label}</div>
            {(ref[key] || []).map((item, i) => (
              <div key={i} className="flex gap-2 mb-1.5 items-center">
                <Input value={item} onChange={e => updateListItem(key, i, e.target.value)} className="flex-1 h-7 text-xs" />
                <button onClick={() => delListItem(key, i)} className="p-1 rounded text-muted hover:text-red-500 cursor-pointer flex-shrink-0"><Trash2 size={11} /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="mt-1 w-full" onClick={() => setRef(r => ({ ...r, [key]: [...(r[key] || []), ""] }))}><Plus size={11} /></Button>
          </div>
        ))}
      </div>

      <Button onClick={() => save(ref)}><Save size={13} /> Сохранить справочник</Button>
    </div>
  );
}
