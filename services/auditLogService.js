import prisma from "../src/lib/prisma.js";

export function formatMrn(patientId) {
  return `MRN #${String(patientId).padStart(6, '0')}`;
}

export function patientLabel(patient) {
  return `${patient.firstName} ${patient.lastName} (${formatMrn(patient.id)})`;
}

export const getAuditLogs = async (page, limit, { action, entity, userId, userRole, from, to } = {}) => {
  const skip = (page - 1) * limit;

  const where = {};

  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;
  if (userRole) where.userRole = userRole;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            role: true,
            patient: { select: { firstName: true, lastName: true } },
            provider: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: logs,
    totalCount,
    totalPages,
    page,
    limit,
  };
};

export const logAudit = async ({
  user,
  action,
  entity,
  entityId,
  details = null,
}) => {
  //Silent fail if no user info
  if (!user || !user.id || !user.role) {
    return;
  }
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
