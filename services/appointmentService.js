import prisma from "../src/lib/prisma.js";
import { HttpError } from "../utils/HttpError.js";

export const createAppointment = async (data) => {
  return await prisma.appointment.create({ data });
}

export const getProviderAppointments = async (id, page, limit, status, { fromDate, endTimeAfter, endTimeBefore } = {}) => {
  const offset = (page - 1) * limit;
  const statusFilter = Array.isArray(status)
    ? status.map((s) => s.toUpperCase())
    : status
      ? [status.toUpperCase()]
      : undefined;

  const endTimeFilter = {
    ...(endTimeAfter && { gte: new Date(endTimeAfter) }),
    ...(endTimeBefore && { lt: new Date(endTimeBefore) }),
  };

  const whereClause = {
    providerId: id,
    ...(statusFilter && { status: { in: statusFilter } }),
    ...(fromDate && { startTime: { gte: new Date(fromDate) } }),
    ...(Object.keys(endTimeFilter).length > 0 && { endTime: endTimeFilter }),
  };
  const [appointment, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { startTime: statusFilter?.every(s => ['COMPLETED', 'CANCELLED'].includes(s)) ? "desc" : "asc" },
      include: {
        patient: {
          include: {
            problems: true,
            allergies: true,
            medications: true,
          },
        },
        visitNote: {
          include: { versions: true },
        },
        vitals: true,
      }
    }),
    prisma.appointment.count({ where: whereClause }),
  ]);

  return {
    data: appointment,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export const countProviderAppointments = async (id, status, { fromDate, endTimeAfter, endTimeBefore } = {}) => {
  const statusFilter = Array.isArray(status)
    ? status.map((s) => s.toUpperCase())
    : status
      ? [status.toUpperCase()]
      : undefined;

  const endTimeFilter = {
    ...(endTimeAfter && { gte: new Date(endTimeAfter) }),
    ...(endTimeBefore && { lt: new Date(endTimeBefore) }),
  };

  return await prisma.appointment.count({
    where: {
      providerId: id,
      ...(statusFilter && { status: { in: statusFilter } }),
      ...(fromDate && { startTime: { gte: new Date(fromDate) } }),
      ...(Object.keys(endTimeFilter).length > 0 && { endTime: endTimeFilter }),
    },
  });
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
