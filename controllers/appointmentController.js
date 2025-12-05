import * as appointmentService from "../services/appointmentService.js";
import * as patientService from "../services/patientService.js";
import * as providerService from "../services/providerService.js";

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
    // Create appointment
    const appointment = await appointmentService.createAppointment({
      patientId,
      providerId,
      startTime: start,
      endTime: end,
      reason,
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

    // Verify provider exists
    const provider = await providerService.getProviderById(id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    // Default pagination values
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // get appointments
    const appointments = await appointmentService.getProviderAppointments(provider.id, pageNum, limitNum, status);

    return res.status(200).json(appointments);

  } catch (error) {
    next(error);
  }
}

// Update appointment by ID
export const updateAppointment = async (req, res, next) => {
  try {
    const { patientId, providerId, startTime, endTime, reason } = req.body;

    const appointmentId = Number(req.params.id);

    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    // Verify appointment exists
    const existing = await appointmentService.getAppointmentById(appointmentId);
    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updates = {};

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

    const appointment = await appointmentService.updateAppointment(appointmentId, updates);
    res.status(200).json(appointment);
  } catch (error) {
    next(error);
  }
}


export const deleteAppointment = async (req, res, next) => {
  try {
    const {id} = req.params;
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
    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    next(error);
  }
}
