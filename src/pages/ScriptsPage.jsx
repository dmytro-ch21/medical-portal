import { useState, useEffect } from "react";
import { scripts as scriptsApi } from "@/api/index.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import { Input, Textarea, Label, Select } from "@/components/ui/input.jsx";
import { copyText } from "@/lib/utils.js";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils.js";

const CAT_COLORS = {
  "Первый контакт": "#4A90D9", "Запись": "#7B68EE", "Цены": "#27AE60",
  "Квалификация": "#E67E22", "Исключения": "#E74C3C", "Напоминания": "#16A085",
  "Документы": "#8E44AD", "Финансы": "#D35400", "Процедура": "#2980B9",
  "Звонки": "#E91E8C",
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async (e) => {
    e.stopPropagation();
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors", copied ? "border-green-400 bg-green-50 text-green-700" : "border-portal-border text-muted hover:border-accent hover:text-accent")}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Скопировано" : "Копировать"}
    </button>
  );
}

export default function ScriptsPage() {
  const { isAdmin } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [activeCat, setActiveCat] = useState("Все");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { scriptsApi.list().then(setScripts); }, []);

  const allCats = ["Все", ...Array.from(new Set(scripts.map(s => s.category)))];
  const filtered = activeCat === "Все" ? scripts : scripts.filter(s => s.category === activeCat);

  const addScript = async (data) => {
    const created = await scriptsApi.create(data);
    setScripts(prev => [...prev, created]);
  };

  const delScript = async (id) => {
    await scriptsApi.remove(id);
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <AddScriptModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addScript}
        existingCats={allCats.filter(c => c !== "Все")}
      />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Скрипты</h1>
          <p className="text-sm text-muted mt-1">{scripts.length} скриптов</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={14} /> Новый скрипт
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {allCats.map(cat => {
          const color = CAT_COLORS[cat];
          const isActive = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border"
              style={{
                borderColor: isActive ? (color || "#C4956A") : "#E8E2DA",
                backgroundColor: isActive ? ((color || "#C4956A") + "20") : "transparent",
                color: isActive ? (color || "#C4956A") : "#7A7A7A",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scripts list */}
      <div className="flex flex-col gap-4">
        {filtered.map(s => {
          const color = CAT_COLORS[s.category] || "#C4956A";
          const isPhone = s.category === "Звонки";
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border"
              style={{
                borderColor: isPhone ? "#E91E8C40" : "#E8E2DA",
                borderLeftWidth: isPhone ? 3 : undefined,
                borderLeftColor: isPhone ? "#E91E8C" : undefined,
              }}
            >
              <div className="flex items-start justify-between px-5 py-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isPhone ? "#FCE4EC" : "#F5EDE3", color: isPhone ? "#E91E8C" : "#C4956A" }}
                  >
                    {s.step || "—"}
                  </div>
                  <span className="text-sm font-semibold">{s.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>
                    {s.category}
                  </span>
                  <CopyBtn text={s.text} />
                  {isAdmin && !s.is_default && (
                    <button onClick={() => delScript(s.id)} className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5">
                <pre
                  className="text-sm leading-relaxed text-[#333] rounded-lg px-4 py-3.5 whitespace-pre-wrap font-sans border"
                  style={{ backgroundColor: isPhone ? "#FFF0F6" : "#F9F7F5", borderColor: isPhone ? "#F8BBD9" : "#E8E2DA" }}
                >
                  {s.text}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddScriptModal({ open, onClose, onAdd, existingCats }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [cat, setCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [useNew, setUseNew] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const finalCat = useNew ? newCat.trim() : cat;

  const submit = async () => {
    if (!title.trim()) return setErr("Введите название");
    if (!text.trim()) return setErr("Введите текст скрипта");
    if (!finalCat) return setErr("Выберите или введите категорию");
    setLoading(true);
    try {
      await onAdd({ title: title.trim(), text: text.trim(), category: finalCat });
      setTitle(""); setText(""); setCat(""); setNewCat(""); setUseNew(false); setErr("");
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Новый скрипт">
      <div className="space-y-4">
        <div>
          <Label>Название</Label>
          <Input placeholder="Например: Ответ на вопрос о сроках" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Категория</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {existingCats.map(c => {
              const color = CAT_COLORS[c] || "#C4956A";
              const isActive = !useNew && cat === c;
              return (
                <button
                  key={c}
                  onClick={() => { setCat(c); setUseNew(false); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border"
                  style={{ borderColor: isActive ? color : "#E8E2DA", backgroundColor: isActive ? color + "20" : "transparent", color: isActive ? color : "#7A7A7A" }}
                >
                  {c}
                </button>
              );
            })}
            <button
              onClick={() => { setUseNew(true); setCat(""); }}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors", useNew ? "border-accent bg-accent-light text-accent" : "border-portal-border text-muted")}
            >
              + Новая
            </button>
          </div>
          {useNew && <Input placeholder="Название новой категории" value={newCat} onChange={e => setNewCat(e.target.value)} />}
        </div>
        <div>
          <Label>Текст скрипта</Label>
          <Textarea rows={6} placeholder="Введите текст сообщения..." value={text} onChange={e => setText(e.target.value)} />
        </div>
        {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠ {err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Сохранение..." : "Добавить"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
