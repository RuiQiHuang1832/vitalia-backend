import prisma from "../src/lib/prisma.js";

export const createMedication = async (data) => {
  return await prisma.medication.create({ data });
}

export const getMedicationsByPatientId = async (patientId) => {
  const medications = await prisma.medication.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  const groupedByStatus = medications.reduce((acc, medication) => {
    const status = medication.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(medication);
    return acc;
  }, {});
  return groupedByStatus;
}

export const updateMedication = async (id, data) => {
  return await prisma.medication.update({
    where: { id },
    data,
  });
}

export const getMedicationById = async (id) => {
  return await prisma.medication.findUnique({
    where: { id },
  });
}
