import { Router } from "express";
import { createProblem, getProblemsForPatient, getProblemById, updateProblem } from "../../controllers/problemController.js";
const router = Router();

router.get("/patient/:id", getProblemsForPatient);
router.get('/:id', getProblemById);
router.post('/', createProblem);
router.put('/:id', updateProblem);

export default router;
