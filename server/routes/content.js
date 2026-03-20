import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET all content blobs (for initial page loads)
router.get("/", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM content").all();
  const result = {};
  rows.forEach(r => { result[r.key] = JSON.parse(r.value); });
  res.json(result);
});

// GET single content blob
router.get("/:key", requireAuth, (req, res) => {
  const row = db.prepare("SELECT value FROM content WHERE key = ?").get(req.params.key);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(JSON.parse(row.value));
});

// PUT update content blob (admin only)
router.put("/:key", requireAdmin, (req, res) => {
  const value = JSON.stringify(req.body);
  db.prepare("INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(req.params.key, value);
  res.json(JSON.parse(value));
});

export default router;
