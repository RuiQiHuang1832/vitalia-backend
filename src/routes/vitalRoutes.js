import { Router } from "express";
import { createVital, deleteVital, getVitalsForAppointment, getVitalsForPatient, updateVital } from "../../controllers/vitalController.js";

const router = Router();

// All vitals during one appointment
router.get("/appointment/:appointmentId", getVitalsForAppointment);
// Vitals history for a specific patient
router.get("/patient/:patientId", getVitalsForPatient);
router.post("/", createVital);
router.put("/:id", updateVital);
router.delete("/:id", deleteVital);
export default router;
