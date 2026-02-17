import { logAudit } from "../services/auditLogService.js";
import * as patientService from "../services/patientService.js";
import { parseDob } from "../utils/validateDate.js";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePhone } from "../utils/validatePhone.js";

const validStatuses = ["ACTIVE", "INACTIVE", "DISCHARGED"];
const validSortBy = [
  "createdAt",
  "firstName",
  "lastName",
  "dob",
  "status",
  "id",
  "name",
  "age",
  "mrn",
];
const validSortOrder = ["asc", "desc"];

export const createPatient = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, dob, phone } = req.body;

    // ---------- Basic validation ----------
    if (!email || !password || !firstName || !lastName || !dob || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Normalize input
    const cleaned = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    //  Validate DOB
    const { value: parsedDob, error: dobError } = parseDob(dob);
    if (dobError) {
      return res.status(400).json({ message: dobError });
    }

    //  Validate email
    const { value: cleanedEmail, error: emailError } = validateEmail(cleaned.email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    //  Validate phone
    const { value: cleanedPhone, error: phoneError } = validatePhone(cleaned.phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }
    //  Check if auth user already exists
    const existingUser = await patientService.checkExistingPatientByEmail(cleanedEmail);

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const { existingEmail, existingPhone } =
      await patientService.checkDuplicatePatient(cleanedEmail, cleanedPhone);

    if (existingEmail) {
      console.warn(`Duplicate patient email detected: ${cleanedEmail}`);
    }

    if (existingPhone) {
      console.warn(`Duplicate patient phone detected: ${cleanedPhone}`);
    }
    const result = await patientService.createPatientWithUser({
      email: cleanedEmail,
      password,
      firstName: cleaned.firstName,
      lastName: cleaned.lastName,
      dob: parsedDob,
      phone: cleanedPhone,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'PATIENT',
      entityId: result.patient.id,
      details: { patient: result.patient }
    });
    return res.status(201).json({
      id: result.patient.id,
      userId: result.user.id,
      email: result.user.email,
      firstName: result.patient.firstName,
      lastName: result.patient.lastName,
      role: result.user.role,
      createdAt: result.user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientByUserId = async (req, res, next) => {
  try {
    // Get provider by ID
    const { id } = req.params;
    // Validate ID is a number
    const uId = Number(id);
    // If NaN, return 400
    if (isNaN(uId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    // Fetch provider
    const patient = await patientService.getPatientByUserId(uId);
    // If not found, return 404
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient.patient);
  } catch (error) {
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
    const { page, limit, name, status, sortBy, sortOrder } = req.query;

    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid page number" });
    }

    if (!Number.isInteger(limitNumber) || limitNumber < 1) {
      return res.status(400).json({ message: "Invalid limit value" });
    }

    // name guard
    const normalizedName =
      typeof name === "string" ? name.trim() : undefined;

    if (normalizedName !== undefined && normalizedName.length > 100) {
      return res.status(400).json({ message: "Name filter too long" });
    }

    // status guard (supports single or repeated query params)
    const statusValues = Array.isArray(status) ? status : typeof status === "string"
        ? [status]
        : [];

    const normalizedStatus = statusValues
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean);

    const hasInvalidStatus = normalizedStatus.some(
      (s) => !validStatuses.includes(s)
    );

    if (hasInvalidStatus) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    const normalizedSortBy =
      typeof sortBy === "string" && validSortBy.includes(sortBy)
        ? sortBy
        : "createdAt";
    const normalizedSortOrder =
      typeof sortOrder === "string" && validSortOrder.includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : "desc";

    const patients = await patientService.getAllPatients(
      pageNumber,
      limitNumber,
      normalizedName || undefined,
      normalizedStatus.length ? normalizedStatus : undefined,
      normalizedSortBy,
      normalizedSortOrder
    );

    return res.status(200).json(patients);
  } catch (error) {
    next(error);
  }
};

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

    const { firstName, lastName, dob, email, phone, status } = req.body;

    // Prepare updates object
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (status !== undefined) {

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      updates.status = status;
    }
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
    const patient = await patientService.updatePatientAndUser(patientId, existing.userId, updates);
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
