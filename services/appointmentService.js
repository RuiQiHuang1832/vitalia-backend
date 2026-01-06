import prisma from "../src/lib/prisma.js";
import {HttpError} from "../utils/HttpError.js";

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
      include: {
        patient:true, 
      }
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

export const checkConflicts = async ({ providerId, start, end, ignoreId = null }) => {
  const conflicts = await prisma.appointment.findFirst({
    where: {
      providerId,
      status: "SCHEDULED", // don't count cancelled appts
      NOT: ignoreId ? { id: ignoreId } : undefined, // ignore appointment being updated
      AND: [
        { startTime: { lt: end } },
        { endTime: { gt: start } },
      ],
    },
  });

if (conflicts) {
    throw new HttpError(409, "Appointment time conflicts with existing appointment");
}
};
