import * as auditLogService from "../services/auditLogService.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, action, entity, userId, userRole, from, to } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

    // Validate userId
    let userIdNum;
    if (userId) {
      userIdNum = Number(userId);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ message: "Invalid userId" });
      }
    }

    // Validate dates
    let fromDate, toDate;
    if (from) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: "Invalid 'from' date" });
      }
    }
    if (to) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Invalid 'to' date" });
      }
    }

    const result = await auditLogService.getAuditLogs(pageNum, limitNum, {
      action,
      entity,
      userId: userIdNum,
      userRole,
      from: fromDate,
      to: toDate,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
