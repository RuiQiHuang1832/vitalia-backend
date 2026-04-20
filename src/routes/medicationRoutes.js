import { Router } from "express";
import { requireRole } from "../../middleware/requireRole.js";

import { createMedication, getMedicationsForPatient, updateMedication } from "../../controllers/medicationController.js";

const router = Router();

// Medication history for a specific patient
router.get("/patient/:patientId", requireRole("PROVIDER", "ADMIN", "PATIENT"), getMedicationsForPatient);

router.post("/", requireRole("PROVIDER", "ADMIN"), createMedication);
router.get("/:id", requireRole("PROVIDER", "ADMIN"), getMedicationsForPatient);
router.put("/:id", requireRole("PROVIDER", "ADMIN"), updateMedication);

export default router;
