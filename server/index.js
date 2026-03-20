import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import patientRoutes from "./routes/patients.js";
import scriptRoutes from "./routes/scripts.js";
import checklistRoutes from "./routes/checklist.js";
import contentRoutes from "./routes/content.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? false : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/patients",  patientRoutes);
app.use("/api/scripts",   scriptRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/content",  contentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../dist/index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
