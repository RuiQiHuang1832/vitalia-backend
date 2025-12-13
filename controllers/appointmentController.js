import * as appointmentService from "../services/appointmentService.js";
import * as patientService from "../services/patientService.js";
import * as providerService from "../services/providerService.js";
import * as visitNoteService from "../services/visitNoteService.js";
import { logAudit } from "../services/auditLogService.js";

export const createAppointment = async (req, res, next) => {
  try {
    const { patientId, providerId, startTime, endTime, reason } = req.body;

    // Basic validation
    if (!patientId || !providerId || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate date parsing
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid start or end time" });
    }

    // Logical validation
    if (start >= end) {
      return res.status(400).json({ message: "Start time cannot be after or equal to end time" });
    }

    // Verify patient exists
    const patient = await patientService.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Verify provider exists
    const provider = await providerService.getProviderById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    await appointmentService.checkConflicts({
      providerId,
      start,
      end,
    });

    // Create appointment
    const appointment = await appointmentService.createAppointment({
      patientId,
      providerId,
      startTime: start,
      endTime: end,
      reason,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'APPOINTMENT',
      entityId: appointment.id,
      details: { appointment }
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

// Get appointments for a provider with pagination and optional status filter
export const getProviderAppointments = async (req, res, next) => {

  try {
    // Get provider by ID
    const { id } = req.params;

    // Handle query params
    const { page, limit, status } = req.query;

    const providerId = Number(id);
    if (isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }

    // Verify provider exists
    const provider = await providerService.getProviderById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    // Default pagination values
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // get appointments
    const appointments = await appointmentService.getProviderAppointments(provider.id, pageNum, limitNum, status);
    await logAudit({
      user: req.user,
      action: 'VIEW',
      entity: 'PROVIDER',
      entityId: providerId,
      details: {
        viewed: 'APPOINTMENT_LIST'
      }
    });
    return res.status(200).json(appointments);

  } catch (error) {
    next(error);
  }
}

// Update appointment by ID
export const updateAppointment = async (req, res, next) => {
  try {
    const { patientId, providerId, startTime, endTime, reason, status } = req.body;

    const appointmentId = Number(req.params.id);

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    // Verify appointment exists
    const existing = await appointmentService.getAppointmentById(appointmentId);
    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updates = {
      updatedAt: new Date(),
    };

    // Patient update
    if (patientId !== undefined) {
      const patient = await patientService.getPatientById(patientId);
      if (!patient) return res.status(404).json({ message: "Patient not found" });
      updates.patientId = patientId;
    }

    // Provider update
    if (providerId !== undefined) {
      const provider = await providerService.getProviderById(providerId);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      updates.providerId = providerId;
    }

    // Time updates
    let start = existing.startTime;
    let end = existing.endTime;

    if (startTime !== undefined) start = new Date(startTime);
    if (endTime !== undefined) end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid start or end time" });
    }

    if (start >= end) {
      return res.status(400).json({ message: "Start time cannot be >= end time" });
    }

    updates.startTime = start;
    updates.endTime = end;

    if (reason !== undefined) updates.reason = reason;
    if (status !== undefined) updates.status = status;

    // Check for conflicts if time or provider changed

    await appointmentService.checkConflicts({
      providerId: providerId ?? existing.providerId,
      start,
      end,
      ignoreId: appointmentId,
    });

    const appointment = await appointmentService.updateAppointment(appointmentId, updates);
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      entity: 'APPOINTMENT',
      entityId: appointmentId,
      details: { previousData: existing, updatedData: appointment }
    });
    res.status(200).json(appointment);
  } catch (error) {
    next(error);
  }
}

// Delete appointment by ID
export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Verify appointment exists
    const appointmentId = Number(id);

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    // Verify appointment exists
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointmentService.deleteAppointment(appointmentId);
    await logAudit({
      user: req.user,
      action: 'DELETE',
      entity: 'APPOINTMENT',
      entityId: appointmentId,
      details: { previousData: appointment }
    });
    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    next(error);
  }
}

// Create visit note for an appointment
export const createVisitNote = async (req, res, next) => {
  try {
    // Only provider can create visit notes, so get it from logged in user
    const providerId = req.user.id;
    const { id } = req.params;
    // Verify appointment exists
    const appointmentId = Number(id);

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    // Verify appointment exists
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.providerId !== providerId) {
      return res.status(403).json({ message: "Forbidden: You are not the provider for this appointment" });
    }

    // Create visit note
    const visitNote = await visitNoteService.createVisitNote({
      providerId,
      appointmentId,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'VISIT_NOTE',
      entityId: visitNote.id,
      details: { visitNote }
    });
    res.status(201).json(visitNote);

  } catch (error) {
    next(error);
  }
}

// Get latest visit note entry for an appointment
export const getLatestVisitNoteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Verify appointment exists
    const appointmentId = Number(id);

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    // Verify appointment exists
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    // If appointment exists but no visit note, return 404
    const visitNote = await visitNoteService.getVisitNoteByAppointmentId(appointmentId);
    if (!visitNote) {
      return res.status(404).json({ message: "Visit note not found" });
    }
    // Get latest entry
    const entry = await visitNoteService.getLatestVisitNoteEntry(visitNote);
    // If no entry found, return 404
    if (!entry) {
      return res.status(404).json({ message: "Visit note ENTRY not found" });
    }
    await logAudit({
      user: req.user,
      action: 'VIEW',
      entity: 'VISIT_NOTE',
      entityId: visitNote.id,
      details: {
        viewed: 'LATEST_VISIT_NOTE_ENTRY'
      }
    });
    res.status(200).json(entry);

  } catch (error) {
    next(error);
  }
}
