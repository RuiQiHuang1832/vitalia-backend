import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { errorHandler } from "../middleware/error.js";
import { notFound } from "../middleware/notFound.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import allergyRoutes from "./routes/allergyRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import providerAvailabilityRoutes from "./routes/providerAvailabilityRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import visitNoteRoutes from "./routes/visitNoteRoutes.js";
import vitalRoutes from "./routes/vitalRoutes.js";
const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://vitalia-frontend-three.vercel.app'],
  credentials: true,
}
app.set('trust proxy', 1)

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions)) // handles all preflight OPTIONS requests

app.get('/health', (req, res) => {
  res.status(200).send('Server is awake!');
});

app.use("/auth", authRoutes);
app.use("/patients", requireAuth, patientRoutes);
app.use("/providers", requireAuth, providerRoutes);
app.use("/appointments", requireAuth, appointmentRoutes);
app.use("/notes", requireAuth, requireRole("PROVIDER"), visitNoteRoutes);
app.use("/problems", requireAuth, requireRole("PROVIDER", "ADMIN"), problemRoutes);
app.use("/allergies", requireAuth, requireRole("PROVIDER", "ADMIN"), allergyRoutes);
app.use("/medications", requireAuth, requireRole("PROVIDER", "ADMIN"), medicationRoutes);
app.use("/vitals", requireAuth, vitalRoutes);
app.use("/availability", requireAuth, requireRole("PROVIDER", "ADMIN"), providerAvailabilityRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
