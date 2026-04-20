import * as allergyService from "../services/allergyService.js";
import * as patientService from "../services/patientService.js";
import * as providerService from "../services/providerService.js";
import { logAudit, patientLabel } from "../services/auditLogService.js";

export const createAllergy = async (req, res, next) => {
  try {
    const { patientId, category, substance, reaction, severity, notes } = req.body;

    const user = await providerService.getProviderByUserId(req.user.id);
    if (!user?.provider) {
      return res.status(403).json({ message: "Forbidden: You are not a provider" });
    }
    const recordedById = user.provider.id;

    // Basic validation
    if (!patientId || !category || !substance) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const patientIdNum = Number(patientId);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    // Check if patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!["FOOD", "MEDICATION", "ENVIRONMENTAL", "OTHER"].includes(category.toUpperCase())) {
      return res.status(400).json({ message: "Invalid category, category can only be FOOD, MEDICATION, ENVIRONMENTAL, or OTHER" });
    }

    if (severity && !["MILD", "MODERATE", "SEVERE"].includes(severity.toUpperCase())) {
      return res.status(400).json({ message: "Invalid severity, severity can only be MILD, MODERATE, or SEVERE" });
    }

    // Create allergy
    const allergy = await allergyService.createAllergy({
      patientId: patientIdNum,
      recordedById,
      category: category.toUpperCase(),
      substance,
      reaction,
      severity: severity ? severity.toUpperCase() : undefined,
      notes,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'ALLERGY',
      entityId: allergy.id,
      details: {
        description: `Added allergy "${allergy.substance}" (${allergy.category}) for ${patientLabel(patient)}`,
        allergy,
      }
    });
    res.status(201).json(allergy);


  } catch (error) {
    next(error);
  }
};


export const getAllergies = async (req, res, next) => {
  try {
    const rawId = req.params.patientId ?? req.params.id;
    const patientIdNum = Number(rawId);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "patientId is required and must be a number" });
    }
    // Ensure the authenticated patient can only view their own allergies
    if (req.user?.patientId && req.user.patientId !== patientIdNum) {
      return res.status(403).json({ message: "Forbidden: cannot access another patient's allergies" });
    }
    // Verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Fetch allergies
    const allergies = await allergyService.getAllergiesByPatientId(patientIdNum);
    res.status(200).json(allergies ?? {});
  } catch (error) {
    next(error);
  }
}


export const updateAllergy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, substance, reaction, severity, notes } = req.body;

    // Validate allergy ID
    const allergyId = Number(id);
    if (isNaN(allergyId)) {
      return res.status(400).json({ message: "Invalid allergy ID" });
    }

    // Check if allergy exists
    const allergy = await allergyService.getAllergyById(allergyId);
    if (!allergy) {
      return res.status(404).json({ message: "Allergy not found" });
    }

    // Resolve provider ID
    const user = await providerService.getProviderByUserId(req.user.id);
    if (!user?.provider) {
      return res.status(403).json({ message: "Forbidden: You are not a provider" });
    }

    // Build update object
    const update = {
      recordedById: user.provider.id,
    }
    if (category !== undefined) {
      if (!["FOOD", "MEDICATION", "ENVIRONMENTAL", "OTHER"].includes(category.toUpperCase())) {
        return res.status(400).json({ message: "Invalid category, category can only be FOOD, MEDICATION, ENVIRONMENTAL, or OTHER" });
      }
      update.category = category.toUpperCase();
    }
    if (substance !== undefined) update.substance = substance;
    if (reaction !== undefined) update.reaction = reaction;
    if (severity !== undefined) {
      if (!["MILD", "MODERATE", "SEVERE"].includes(severity.toUpperCase())) {
        return res.status(400).json({ message: "Invalid severity, severity can only be MILD, MODERATE, or SEVERE" });
      }
      update.severity = severity.toUpperCase();
    }
    if (notes !== undefined) update.notes = notes;

    const updatedAllergy = await allergyService.updateAllergy(allergyId, update);
    const patient = await patientService.getPatientById(allergy.patientId);

    await logAudit({
      user: req.user,
      action: 'UPDATE',
      entity: 'ALLERGY',
      entityId: allergyId,
      details: {
        description: `Updated allergy "${updatedAllergy.substance}" for ${patientLabel(patient)}`,
        previousData: allergy,
        updatedData: updatedAllergy,
      }
    });
    res.status(200).json(updatedAllergy);

  } catch (error) {
    next(error);
  }
};


export const deleteAllergy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allergyId = Number(id);
    if (isNaN(allergyId)) {
      return res.status(400).json({ message: "Invalid allergy ID" });
    }
    // Check if allergy exists
    const allergy = await allergyService.getAllergyById(allergyId);
    if (!allergy) {
      return res.status(404).json({ message: "Allergy not found" });
    }
    await allergyService.deleteAllergy(allergyId);
    const patient = await patientService.getPatientById(allergy.patientId);

    await logAudit({
      user: req.user,
      action: 'DELETE',
      entity: 'ALLERGY',
      entityId: allergyId,
      details: {
        description: `Deleted allergy "${allergy.substance}" for ${patientLabel(patient)}`,
        previousData: allergy,
      }
    });
    res.status(200).json({ message: "Allergy successfully deleted" });
  } catch (error) {
    next(error);
  }
};
