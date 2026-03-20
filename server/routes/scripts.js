import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const scripts = db.prepare("SELECT * FROM scripts ORDER BY priority ASC, id ASC").all();
  res.json(scripts);
});

router.post("/", requireAdmin, (req, res) => {
  const { step, title, category, text } = req.body;
  if (!title || !category || !text) return res.status(400).json({ error: "title, category, text required" });
  const maxPriority = db.prepare("SELECT MAX(priority) as m FROM scripts").get().m || 0;
  const result = db.prepare("INSERT INTO scripts (step, title, category, text, priority, is_default, created_by) VALUES (?, ?, ?, ?, ?, 0, ?)").run(step||null, title, category, text, maxPriority + 1, req.user.id);
  res.status(201).json(db.prepare("SELECT * FROM scripts WHERE id = ?").get(result.lastInsertRowid));
});

router.patch("/:id", requireAdmin, (req, res) => {
  const script = db.prepare("SELECT id FROM scripts WHERE id = ?").get(req.params.id);
  if (!script) return res.status(404).json({ error: "Script not found" });
  const { step, title, category, text, priority } = req.body;
  const updates = [];
  const vals = [];
  if (step !== undefined)     { updates.push("step = ?");     vals.push(step); }
  if (title !== undefined)    { updates.push("title = ?");    vals.push(title); }
  if (category !== undefined) { updates.push("category = ?"); vals.push(category); }
  if (text !== undefined)     { updates.push("text = ?");     vals.push(text); }
  if (priority !== undefined) { updates.push("priority = ?"); vals.push(priority); }
  if (updates.length) {
    db.prepare(`UPDATE scripts SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  }
  res.json(db.prepare("SELECT * FROM scripts WHERE id = ?").get(req.params.id));
});

router.post("/reorder", requireAdmin, (req, res) => {
  // body: { ids: [1, 5, 3, ...] } — ordered list of script ids
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
  const update = db.prepare("UPDATE scripts SET priority = ? WHERE id = ?");
  const reorderAll = db.transaction(() => ids.forEach((id, i) => update.run(i, id)));
  reorderAll();
  res.json({ ok: true });
});

router.delete("/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM scripts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
