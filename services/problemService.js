import prisma from "../src/lib/prisma";

export const createProblem = async (data) => {
  return await prisma.problem.create({ data });
}

export const getProblemsByPatientId = async (patientId) => {
 return await prisma.problem.findMany( {
  where: { patientId},
  orderBy: { createdAt: "desc" },
 })
}

export const getProblemById = async (id) => {
  return await prisma.problem.findUnique({
    where: { id },
  });
}

export const updateProblem = async (id, data) => {
  return await prisma.problem.update({
    where: { id },
    data,
  });
}
