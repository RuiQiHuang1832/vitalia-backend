import { Router } from "express";

import { createMedication, getMedicationsForPatient, updateMedication } from "../../controllers/medicationController.js";

const router = Router();

router.post("/", createMedication);
// Get Medications for a patient via query param
router.get("/", getMedicationsForPatient);
router.put("/:id", updateMedication);

export default router;
