import { logAudit } from "../services/auditLogService.js";
import * as medicationService from "../services/medicationService.js";
import * as patientService from "../services/patientService.js";

export const createMedication = async (req, res, next) => {
  try {
    const { patientId, name, dosage, frequency, startDate, notes } = req.body;
    const prescribedById = req.user.id;
    // Basic validation
    if (!patientId || !name || !dosage || !frequency || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const patientIdNum = Number(patientId);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    // verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }


    const medication = await medicationService.createMedication({
      patientId: patientIdNum,
      prescribedBy: prescribedById,
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      notes,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'MEDICATION',
      entityId: medication.id,
      details: { medication }
    });
    res.status(201).json(medication);
  } catch (error) {
    next(error);
  }

}


export const getMedicationsForPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientIdNum = Number(id);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "patientId is required and must be a number" });
    }
    // Verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Fetch medications
    const medications = await medicationService.getMedicationsByPatientId(patientIdNum);
    await logAudit({
      user: req.user,
      action: 'VIEW',
      entity: 'PATIENT',
      entityId: patientIdNum,
      details: {
        viewed: 'MEDICATION_LIST'
      }
    });
    res.status(200).json(medications);
  } catch (error) {
    next(error);
  }
};


export const updateMedication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, status, notes } = req.body;
    const medicationId = Number(id);
    if (isNaN(medicationId)) {
      return res.status(400).json({ message: "Invalid medication ID" });
    }
    // Build update object
    const update = {};
    if (name !== undefined) update.name = name;
    if (dosage !== undefined) update.dosage = dosage;
    if (frequency !== undefined) update.frequency = frequency;
    if (status !== undefined) {
      if (!["ACTIVE", "COMPLETED", "DISCONTINUED"].includes(status.toUpperCase())) {
        return res.status(400).json({ message: "Invalid status, status can only be ACTIVE, COMPLETED, or DISCONTINUED" });
      }
      if (status.toUpperCase() === "DISCONTINUED") {
        update.endDate = new Date();
      }
      if (status.toUpperCase() === "ACTIVE") {
        update.endDate = null;
      }
      update.status = status.toUpperCase();
    }
    if (notes !== undefined) update.notes = notes;

    // Verify medication exists
    const medication = await medicationService.getMedicationById(medicationId);
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    // Perform update
    const updatedMedication = await medicationService.updateMedication(medicationId, update);

    await logAudit({
      user: req.user,
      action: 'UPDATE',
      entity: 'MEDICATION',
      entityId: medicationId,
      details: { previousData: medication, updatedData: updatedMedication }
    });

    res.status(200).json(updatedMedication);
  } catch (error) {
    next(error);
  }
};
