import * as visitNoteService from "../services/visitNoteService.js";
import { logAudit } from "../services/auditLogService.js";

export const createVisitNoteEntry = async (req, res, next) => {
  try {
    const { visitNoteId } = req.params;
    const { content } = req.body || {};
    const providerId = req.user.id;

    // Basic validation, there should be content.
    if (!content) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const visitNoteIdNumber = Number(visitNoteId);
    if (isNaN(visitNoteIdNumber)) {
      return res.status(400).json({ message: "Invalid visit note ID" });
    }

    const visitNote = await visitNoteService.getVisitNoteById(visitNoteIdNumber);
    if (!visitNote) {
      return res.status(404).json({ message: "Visit note not found" });
    }

    if (providerId !== visitNote.providerId) {
      return res.status(403).json({ message: "Forbidden: You are not the provider for this visit note" });
    }

    const newEntry = await visitNoteService.createVisitNoteEntry({
      visitNoteId: visitNoteIdNumber,
      content,
      editedById: providerId,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'VISIT_NOTE_ENTRY',
      entityId: newEntry.id,
      details: { newEntry }
    });
    res.status(201).json(newEntry);
  } catch (error) {
    next(error);
  }
};



export const getAllVisitNoteEntries = async (req, res, next) => {
  try {
    const { visitNoteId } = req.params;
    const visitNoteIdNumber = Number(visitNoteId);
    if (isNaN(visitNoteIdNumber)) {
      return res.status(400).json({ message: "Invalid visit note ID" });
    }
    // Verify visit note exists
    const visitNote = await visitNoteService.getVisitNoteById(visitNoteIdNumber);
    if (!visitNote) {
      return res.status(404).json({ message: "Visit note not found" });
    }

    const entries = await visitNoteService.getAllVisitNoteEntries(visitNoteIdNumber);
    await logAudit({
      user: req.user,
      action: 'VIEW',
      entity: 'VISIT_NOTE',
      entityId: visitNoteIdNumber,
      details: {
        viewed: 'VISIT_NOTE_ENTRY_LIST'
      }
    });
    res.status(200).json(entries);
  }
  catch (error) {
    next(error);
  };
};
