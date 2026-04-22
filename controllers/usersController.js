import { logAudit } from "../services/auditLogService.js";
import * as userService from "../services/userService.js";

const validRoles = ["PATIENT", "PROVIDER", "ADMIN"];
const validProviderStatuses = ["ACTIVE", "INACTIVE"];

export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;

    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid page number" });
    }
    if (!Number.isInteger(limitNumber) || limitNumber < 1) {
      return res.status(400).json({ message: "Invalid limit value" });
    }

    let normalizedRole;
    if (typeof role === "string") {
      const upper = role.toUpperCase();
      if (!validRoles.includes(upper)) {
        return res.status(400).json({ message: "Invalid role filter" });
      }
      normalizedRole = upper;
    }

    const result = await userService.getAllUsers(pageNumber, limitNumber, normalizedRole);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const uId = Number(userId);
    if (!Number.isInteger(uId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { status } = req.body;
    if (!validProviderStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const result = await userService.updateProviderStatusByUserId(uId, status);

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    if (result.error === "NOT_PROVIDER") {
      return res.status(403).json({
        message: "Only provider status can be changed from this endpoint",
      });
    }
    if (result.error === "NO_PROFILE") {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    await logAudit({
      user: req.user,
      action: "UPDATE",
      entity: "PROVIDER",
      entityId: result.provider.id,
      details: {
        description: `Set provider ${result.provider.firstName} ${result.provider.lastName} status to ${status}`,
        providerId: result.provider.id,
        status,
      },
    });

    return res.status(200).json({
      userId: result.user.id,
      profileId: result.provider.id,
      role: result.user.role,
      status: result.provider.status,
    });
  } catch (error) {
    next(error);
  }
};
