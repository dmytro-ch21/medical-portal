import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const { status, date } = req.query;
  let q = "SELECT * FROM patients WHERE 1=1";
  const params = [];
  if (status) { q += " AND status = ?"; params.push(status); }
  if (date)   { q += " AND consultation_date = ?"; params.push(date); }
  q += " ORDER BY created_at DESC";
  res.json(db.prepare(q).all(...params));
});

router.post("/", (req, res) => {
  const p = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  db.prepare(`INSERT INTO patients (id, name, doctor, procedure, status, consultation_date, consultation_time,
    phone, email, messenger, city, state, country, language, source, budget, consult_format,
    dob, prev_surgery, med_notes, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, p.name, p.doctor||null, p.procedure||null, p.status||"lead",
      p.consultationDate||null, p.consultationTime||null,
      p.phone||null, p.email||null, p.messenger||null,
      p.city||null, p.state||null, p.country||null,
      p.language||null, p.source||null, p.budget||null, p.consultFormat||null,
      p.dob||null, p.prevSurgery||null, p.medNotes||null, p.notes||null,
      req.user.id);
  res.status(201).json(db.prepare("SELECT * FROM patients WHERE id = ?").get(id));
});

router.patch("/:id", (req, res) => {
  const p = req.body;
  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  db.prepare(`UPDATE patients SET
    name=?, doctor=?, procedure=?, status=?, consultation_date=?, consultation_time=?,
    phone=?, email=?, messenger=?, city=?, state=?, country=?,
    language=?, source=?, budget=?, consult_format=?,
    dob=?, prev_surgery=?, med_notes=?, notes=?,
    updated_at=datetime('now')
    WHERE id=?`)
    .run(p.name, p.doctor||null, p.procedure||null, p.status||"lead",
      p.consultationDate||null, p.consultationTime||null,
      p.phone||null, p.email||null, p.messenger||null,
      p.city||null, p.state||null, p.country||null,
      p.language||null, p.source||null, p.budget||null, p.consultFormat||null,
      p.dob||null, p.prevSurgery||null, p.medNotes||null, p.notes||null,
      req.params.id);
  res.json(db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM patients WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
