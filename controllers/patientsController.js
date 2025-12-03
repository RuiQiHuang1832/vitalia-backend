import * as patientService from "../services/patientService.js";
import { parseDob } from "../utils/validateDate.js";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePhone } from "../utils/validatePhone.js";

export const createPatient = async (req, res, next) => {
  try {
    const { firstName, lastName, dob, email, phone } = req.body;
    // Basic validation
    if (!firstName || !lastName || !dob || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // trim strings
    const cleaned = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    // Validate DOB format (YYYY-MM-DD)
    const { value: parsedDob, error: dobError } = parseDob(dob);
    if (dobError) {
      return res.status(400).json({ message: dobError });
    }
    // Validate email and phone
    const { value: cleanedEmail, error: emailError } = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const { value: cleanedPhone, error: phoneError } = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }
    // Check for duplicates
    const { existingEmail, existingPhone } =
      await patientService.checkDuplicatePatient(cleanedEmail, cleanedPhone);

    // Log duplicates but allow creation to proceed
    if (existingEmail) {
      console.warn(`Duplicate email detected: ${email} (ID ${existingEmail.id})`);
    }

    if (existingPhone) {
      console.warn(`Duplicate phone detected: ${phone} (ID ${existingPhone.id})`);
    }
    // Create patient
    const patient = await patientService.createPatient({ ...cleaned, dob: parsedDob });
    res.status(201).json(patient);

  } catch (error) {
    console.error("Error creating patient:", error);
    next(error);
  }
}

export const getPatient = async (req, res, next) => {
  try {
    // Get patient by ID
    const { id } = req.params;
    // Validate ID is a number
    const patientId = Number(id);
    // If NaN, return 400
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    // Fetch patient
    const patient = await patientService.getPatientById(patientId);
    // If not found, return 404
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (error) {
    next(error);
  }
}

export const getAllPatients = async (req, res, next) => {
  try {
    // Handle pagination
    const { page, limit } = req.query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    // Validate numeric & positive
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid page number" });
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
      return res.status(400).json({ message: "Invalid limit value" });
    }
    // Fetch patients
    const patients = await patientService.getAllPatients(pageNumber, limitNumber);
    res.status(200).json(patients);
  } catch (error) {
    next(error);
  }
}

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientId = Number(id);
    // Validate ID is a number
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    // Check if patient exists
    const existing = await patientService.getPatientById(patientId);
    if (!existing) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const { firstName, lastName, dob, email, phone } = req.body;

    // Prepare updates object
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (email !== undefined) {
      const { value: cleanedEmail, error: emailError } = validateEmail(email);
      if (emailError) {
        return res.status(400).json({ message: emailError });
      }
      updates.email = cleanedEmail;
    }
    if (phone !== undefined) {
      const { value: cleanedPhone, error: phoneError } = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ message: phoneError });
      }
      updates.phone = cleanedPhone;
    }

    if (dob !== undefined) {
      const { date: parsedDob, error } = parseDob(dob);
      if (error) {
        return res.status(400).json({ message: error });
      }

      updates.dob = parsedDob;
    }
    // Perform update
    const patient = await patientService.updatePatient(patientId, updates);
    res.status(200).json(patient);
  } catch (error) {
    next(error);
  }
}

export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientId = Number(id);
    // Validate ID is a number
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    // Check if patient exists
    const existing = await patientService.getPatientById(patientId);
    if (!existing) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Delete patient
    await patientService.deletePatient(patientId);
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    next(error);
  }
}
