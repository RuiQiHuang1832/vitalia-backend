import { Router } from "express";
import { createAppointment, createVisitNote, deleteAppointment, getLatestVisitNoteEntry, getProviderAppointments, updateAppointment } from "../../controllers/appointmentController.js";
import { requireRole } from "../../middleware/requireRole.js";
const router = Router();

// Appointment routes
router.get('/provider/:id', requireRole("PROVIDER"), getProviderAppointments);
router.post('/', requireRole("PROVIDER"), createAppointment);
router.put('/:id', requireRole("PROVIDER"), updateAppointment);
router.delete('/:id', requireRole("PROVIDER"), deleteAppointment);

// Visit Notes routes
router.post("/:id/notes", requireRole("PROVIDER"), createVisitNote);
router.get("/:id/notes", getLatestVisitNoteEntry)

export default router;
