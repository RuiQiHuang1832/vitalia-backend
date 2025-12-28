import { Router } from "express";
import { createPatient, deletePatient, getAllPatients, getPatient, getPatientByUserId, updatePatient } from "../../controllers/patientsController.js";

const router = Router();

router.get('/:id', getPatient);
router.get('/user/:id', getPatientByUserId);
router.get("/", getAllPatients);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
