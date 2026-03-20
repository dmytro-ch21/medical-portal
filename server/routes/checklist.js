import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const sections = db.prepare("SELECT * FROM checklist_sections ORDER BY priority ASC").all();
  const items = db.prepare("SELECT * FROM checklist_items ORDER BY priority ASC").all();
  res.json(sections.map(s => ({ ...s, items: items.filter(i => i.section_id === s.id) })));
});

// ── Sections ──────────────────────────────────────────────────────────────────
router.post("/sections", requireAdmin, (req, res) => {
  const { id, icon, label, color } = req.body;
  if (!id || !label) return res.status(400).json({ error: "id and label required" });
  const maxP = db.prepare("SELECT MAX(priority) as m FROM checklist_sections").get().m || 0;
  db.prepare("INSERT INTO checklist_sections (id, icon, label, color, priority) VALUES (?, ?, ?, ?, ?)").run(id, icon||null, label, color||null, maxP + 1);
  res.status(201).json(db.prepare("SELECT * FROM checklist_sections WHERE id = ?").get(id));
});

router.patch("/sections/:id", requireAdmin, (req, res) => {
  const { icon, label, color, priority } = req.body;
  const updates = []; const vals = [];
  if (icon !== undefined)     { updates.push("icon = ?");     vals.push(icon); }
  if (label !== undefined)    { updates.push("label = ?");    vals.push(label); }
  if (color !== undefined)    { updates.push("color = ?");    vals.push(color); }
  if (priority !== undefined) { updates.push("priority = ?"); vals.push(priority); }
  if (updates.length) db.prepare(`UPDATE checklist_sections SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  res.json(db.prepare("SELECT * FROM checklist_sections WHERE id = ?").get(req.params.id));
});

router.delete("/sections/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM checklist_sections WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Items ─────────────────────────────────────────────────────────────────────
router.post("/sections/:sectionId/items", requireAdmin, (req, res) => {
  const { text, subgroup } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const maxP = db.prepare("SELECT MAX(priority) as m FROM checklist_items WHERE section_id = ?").get(req.params.sectionId).m || 0;
  const result = db.prepare("INSERT INTO checklist_items (section_id, text, subgroup, priority) VALUES (?, ?, ?, ?)").run(req.params.sectionId, text, subgroup||null, maxP + 1);
  res.status(201).json(db.prepare("SELECT * FROM checklist_items WHERE id = ?").get(result.lastInsertRowid));
});

router.patch("/items/:id", requireAdmin, (req, res) => {
  const { text, subgroup, priority } = req.body;
  const updates = []; const vals = [];
  if (text !== undefined)     { updates.push("text = ?");     vals.push(text); }
  if (subgroup !== undefined) { updates.push("subgroup = ?"); vals.push(subgroup); }
  if (priority !== undefined) { updates.push("priority = ?"); vals.push(priority); }
  if (updates.length) db.prepare(`UPDATE checklist_items SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  res.json(db.prepare("SELECT * FROM checklist_items WHERE id = ?").get(req.params.id));
});

router.delete("/items/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM checklist_items WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
