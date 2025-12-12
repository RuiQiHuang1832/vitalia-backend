import * as allergyService from "../services/allergyService.js";
import * as patientService from "../services/patientService.js";

export const createAllergy = async (req, res, next) => {
  try {
    const { patientId, category, substance, reaction, severity, notes } = req.body;
    const recordedById = req.user.id;
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
    res.status(201).json(allergy);


  } catch (error) {
    next(error);
  }
};


export const getAllergies = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    const patientIdNum = Number(patientId);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "patientId is required and must be a number" });
    }
    // Verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Fetch allergies
    const allergies = await allergyService.getAllergiesByPatientId(patientIdNum);
    if (!allergies || Object.keys(allergies).length === 0) {
      return res.status(404).json({ message: "No allergies found for this patient" });
    }
    res.status(200).json(allergies);
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

    // Build update object
    const update = {
      recordedById: req.user.id,
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
    res.status(200).json({ message: "Allergy successfully deleted" });
  } catch (error) {
    next(error);
  }
};
