import prisma from "../src/lib/prisma.js";

export const createVital = async (data) => {
  return await prisma.vital.create({ data });
}

export const getVitalsByAppointmentId = async (appointmentId) => {
  return await prisma.vital.findMany({
    where: { appointmentId },
    orderBy: { recordedAt: "desc" },
  });
}

export const getVitalsByPatientId = async (patientId) => {
  return await prisma.vital.findMany({
    where: { patientId },
    orderBy: { recordedAt: "desc" },
  });
}

export const updateVital = async (id, data) => {
  return await prisma.vital.update({
    where: { id },
    data,
  });
}

export const getVitalById = async (id) => {
  return await prisma.vital.findUnique({
    where: { id }
  });
}


export const deleteVital = async (id) => {
  return await prisma.vital.delete({
    where: { id },
  });
}
