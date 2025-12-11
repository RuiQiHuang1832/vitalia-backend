import "dotenv/config";
import express from "express";
import { errorHandler } from "../middleware/error.js";
import { notFound } from "../middleware/notFound.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import visitNoteRoutes from "./routes/visitNoteRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRoutes);
app.use("/patients", requireAuth, requireRole("ADMIN", "PROVIDER"), patientRoutes);
app.use("/providers", requireAuth, requireRole("ADMIN"), providerRoutes);
app.use("/appointments", requireAuth, appointmentRoutes);
app.use("/notes", requireAuth, requireRole("PROVIDER"), visitNoteRoutes);
app.use("/problems", requireAuth, requireRole("PROVIDER", "ADMIN"), problemRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
