import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const user = db.prepare("SELECT * FROM users WHERE username = ? AND is_active = 1").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role, display_name: user.display_name });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ id: user.id, username: user.username, role: user.role, display_name: user.display_name });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, username, role, display_name FROM users WHERE id = ? AND is_active = 1").get(req.user.id);
  if (!user) return res.status(401).json({ error: "User not found" });
  res.json(user);
});

export default router;
