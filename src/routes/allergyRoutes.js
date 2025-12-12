import { Router } from "express";
import { createAllergy, getAllergies, deleteAllergy, updateAllergy } from "../../controllers/allergyController.js";
const router = Router();


router.get('/:id', getAllergies);
router.post('/', createAllergy);
router.put('/:id', updateAllergy);
router.delete('/:id', deleteAllergy);

export default router;
