import prisma from "../src/lib/prisma.js";


export const createAllergy = async (data) => {
  return await prisma.allergy.create({ data });
}

export const getAllergiesByPatientId = async (patientId) => {
  const allergies = await prisma.allergy.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  const groupedByCategory = allergies.reduce((acc, allergy) => {
    const category = allergy.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(allergy);
    return acc;
  }, {});
  return groupedByCategory;
}

export const getAllergyById = async (id) => {
  return await prisma.allergy.findUnique({
    where: { id },
  });
}

export const updateAllergy = async (id, data) => {
  return await prisma.allergy.update({
    where: { id },
    data,
  });
}

export const deleteAllergy = async (id) => {
  return await prisma.allergy.delete({
    where: { id },
  });
}
