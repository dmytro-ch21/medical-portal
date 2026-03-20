import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/", (req, res) => {
  const users = db.prepare("SELECT id, username, role, display_name, is_active, created_at FROM users ORDER BY id").all();
  res.json(users);
});

router.post("/", (req, res) => {
  const { username, password, role = "coordinator", display_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  if (!["admin", "coordinator"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)").run(username, hash, role, display_name || username);
    res.status(201).json({ id: result.lastInsertRowid, username, role, display_name: display_name || username });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Username already exists" });
    throw e;
  }
});

router.patch("/:id", (req, res) => {
  const { display_name, role, is_active, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (display_name !== undefined) db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(display_name, user.id);
  if (role !== undefined && ["admin", "coordinator"].includes(role)) db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, user.id);
  if (is_active !== undefined) db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, user.id);
  if (password) db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 10), user.id);

  const updated = db.prepare("SELECT id, username, role, display_name, is_active FROM users WHERE id = ?").get(user.id);
  res.json(updated);
});

export default router;
