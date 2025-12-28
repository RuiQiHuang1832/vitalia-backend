import { Router } from "express";
import { createPatient, deletePatient, getAllPatients, getPatient, getPatientByUserId, updatePatient } from "../../controllers/patientsController.js";
import { requireRole } from "../../middleware/requireRole.js";
const router = Router();

router.get('/:id', requireRole("ADMIN", "PROVIDER", "PATIENT"), getPatient);
router.get('/user/:id', requireRole("ADMIN", "PROVIDER", "PATIENT"), getPatientByUserId);
router.get("/", requireRole("ADMIN", "PROVIDER"), getAllPatients);
router.post('/', requireRole("ADMIN", "PROVIDER"), createPatient);
router.put('/:id', requireRole("ADMIN", "PROVIDER"), updatePatient);
router.delete('/:id', requireRole("ADMIN", "PROVIDER"), deletePatient);

export default router;
