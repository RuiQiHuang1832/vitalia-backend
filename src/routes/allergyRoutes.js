import { Router } from "express";
import { requireRole } from "../../middleware/requireRole.js";
import { createAllergy, getAllergies, deleteAllergy, updateAllergy } from "../../controllers/allergyController.js";
const router = Router();

// Allergy history for a specific patient
router.get('/patient/:patientId', requireRole("PROVIDER", "ADMIN", "PATIENT"), getAllergies);

router.get('/:id', requireRole("PROVIDER", "ADMIN"), getAllergies);
router.post('/', requireRole("PROVIDER", "ADMIN"), createAllergy);
router.put('/:id', requireRole("PROVIDER", "ADMIN"), updateAllergy);
router.delete('/:id', requireRole("PROVIDER", "ADMIN"), deleteAllergy);

export default router;
