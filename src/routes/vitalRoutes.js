import { Router } from "express";
import { createVital, deleteVital, getVitalsForAppointment, getVitalsForPatient, updateVital } from "../../controllers/vitalController.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

// All vitals during one appointment
router.get("/appointment/:appointmentId", requireRole("PROVIDER", "ADMIN"), getVitalsForAppointment);

// Vitals history for a specific patient
router.get("/patient/:patientId", requireRole("PROVIDER", "ADMIN", "PATIENT"), getVitalsForPatient);

router.post("/", requireRole("PROVIDER", "ADMIN"), createVital);
router.put("/:id", requireRole("PROVIDER", "ADMIN"), updateVital);
router.delete("/:id", requireRole("PROVIDER", "ADMIN"), deleteVital);
export default router;
