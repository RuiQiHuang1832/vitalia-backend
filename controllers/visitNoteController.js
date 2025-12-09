import * as visitNoteService from "../services/visitNoteService.js";

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
    res.status(200).json(entries);
  }
  catch (error) {
    next(error);
  };
};
