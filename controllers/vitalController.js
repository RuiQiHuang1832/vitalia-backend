import * as appointmentService from '../services/appointmentService.js';
import * as vitalService from '../services/vitalService.js';
import * as patientService from '../services/patientService.js';
export const createVital = async (req, res, next) => {
  try {
    const { appointmentId, heartRate, bloodPressureSystolic, bloodPressureDiastolic, temperature, weight, oxygenSaturation } = req.body;
    const providerId = req.user.id;
    //Basic validation
    if (!appointmentId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Validate appointment exists
    const appointmentIdNum = Number(appointmentId);
    if (isNaN(appointmentIdNum)) {
      return res.status(400).json({ message: 'Invalid appointmentId.' });
    }
    const appointment = await appointmentService.getAppointmentById(appointmentIdNum);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    const patientIdNum = appointment.patientId;
    // Create vital record
    const vital = await vitalService.createVital({
      appointmentId: appointmentIdNum,
      patientId: patientIdNum,
      providerId,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      temperature,
      weight,
      oxygenSaturation
    });
    res.status(201).json(vital);
  } catch (error) {
    next(error);
  }
}

export const getVitalsForAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    // Validate appointment exists
    const appointmentIdNum = Number(appointmentId);
    if (isNaN(appointmentIdNum)) {
      return res.status(400).json({ message: 'Invalid appointmentId.' });
    }
    const appointment = await appointmentService.getAppointmentById(appointmentIdNum);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    // Fetch vitals for appointment
    const vitals = await vitalService.getVitalsByAppointmentId(appointmentIdNum);
    res.status(200).json(vitals);
  } catch (error) {
    next(error);
  }
}
// Get vital history for a specific patient
export const getVitalsForPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patientIdNum = Number(patientId);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: 'Invalid patientId.' });
    }
    //Check access rights
    if (req.user.role === 'PATIENT' && req.user.id !== patientIdNum) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    // Check if patient exist
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    const vitals = await vitalService.getVitalsByPatientId(patientIdNum);
    res.status(200).json(vitals);
  } catch (error) {
    next(error);
  }
}

export const updateVital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vitalIdNum = Number(id);
    if (isNaN(vitalIdNum)) {
      return res.status(400).json({ message: 'Invalid vital ID.' });
    }

    const { heartRate, bloodPressureSystolic, bloodPressureDiastolic, temperature, weight, oxygenSaturation } = req.body;

    const update = {};
    if (heartRate !== undefined) update.heartRate = heartRate;
    if (bloodPressureSystolic !== undefined) update.bloodPressureSystolic = bloodPressureSystolic;
    if (bloodPressureDiastolic !== undefined) update.bloodPressureDiastolic = bloodPressureDiastolic;
    if (temperature !== undefined) update.temperature = temperature;
    if (weight !== undefined) update.weight = weight;
    if (oxygenSaturation !== undefined) update.oxygenSaturation = oxygenSaturation;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }
    const vital = await vitalService.getVitalById(vitalIdNum);
    if (!vital) {
      return res.status(404).json({ message: 'Vital record not found.' });
    }

    const updatedVital = await vitalService.updateVital(vitalIdNum, update);
    res.status(200).json(updatedVital);
  } catch (error) {
    next(error);
  }
}

export const deleteVital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vitalIdNum = Number(id);
    if (isNaN(vitalIdNum)) {
      return res.status(400).json({ message: 'Invalid vital ID.' });
    }
    // Check if vital exists
    const vital = await vitalService.getVitalById(vitalIdNum);
    if (!vital) {
      return res.status(404).json({ message: 'Vital record not found.' });
    }
    // Delete vital record
    await vitalService.deleteVital(vitalIdNum);
    res.status(200).json({message: 'Vital record deleted.'});
  } catch (error) {
    next(error);
  }
}
