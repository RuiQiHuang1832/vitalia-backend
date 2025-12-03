import "dotenv/config";
import express from "express";
import { errorHandler } from "../middleware/error.js";
import { notFound } from "../middleware/notFound.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRoutes);
app.use("/patients", requireAuth, requireRole("ADMIN"), patientRoutes);
app.use("/providers", requireAuth, requireRole("ADMIN"), providerRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
