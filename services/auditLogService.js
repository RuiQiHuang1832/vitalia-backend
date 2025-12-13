import prisma from "../src/lib/prisma.js";


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
