import prisma from "../src/lib/prisma.js";

export const createAppointment = async (data) => {
  return await prisma.appointment.create({ data });
}

export const getProviderAppointments = async (id, page, limit, status) => {
  const normalizedStatus = status ? status.toUpperCase() : undefined;
  const offset = (page - 1) * limit;
  const whereClause = {
    providerId: id,
    status: normalizedStatus,
  };
  const [appointment, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.count({ where: whereClause }),
  ]);

  return {
    data: appointment,
    totalCount,
    page,
    limit,
  };
}

export const updateAppointment = async (id, data) => {
  return await prisma.appointment.update({
    where: { id },
    data,
  });
}

export const deleteAppointment = async (id) => {
  return await prisma.appointment.delete({
    where: { id },
  });
}

export const getAppointmentById = async (id) => {
  return await prisma.appointment.findUnique({
    where: { id: Number(id) }
  });
};
