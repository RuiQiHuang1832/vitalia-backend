import { Router } from "express";
import { createAppointment, deleteAppointment, getProviderAppointments, updateAppointment } from "../../controllers/appointmentController.js";

const router = Router();

router.get('/provider/:id', getProviderAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
