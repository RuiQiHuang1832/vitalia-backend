import prisma from "../src/lib/prisma.js";

// Data is a clean payload prepared in the controller
// This service does zero validation, that belongs to controller/middleware
// Returns the created patient record
export const createPatient = async (data) => {
  return await prisma.patient.create({ data });
}
// Returns patient by ID or null if not found
export const getPatientById = async (id) => {
  return await prisma.patient.findUnique({ where: { id } });
}

// Returns paginated list of patients
export const getAllPatients = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [patients, totalCount] = await Promise.all([
    prisma.patient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.patient.count(),
  ]);

  return {
    data: patients,
    totalCount,
    page,
    limit,
  };
};

// Updates patient by ID with provided data
export const updatePatient = async (id, data) => {
  return await prisma.patient.update({
    where: { id },
    data,
  });
}

// Deletes patient by ID
export const deletePatient = async (id) => {
  return await prisma.patient.delete({
    where: { id },
  });
}

// Checks for existing patient by email or phone
export const checkDuplicatePatient = async (email, phone) => {
  const [existingEmail, existingPhone] = await Promise.all([
    prisma.patient.findFirst({ where: { email } }),
    prisma.patient.findFirst({ where: { phone } })
  ]);

  return { existingEmail, existingPhone };
};
