import { Router } from 'express';

import { createVisitNoteEntry, getAllVisitNoteEntries } from '../../controllers/visitNoteController.js';

const router = Router();

router.get('/:visitNoteId/entries', getAllVisitNoteEntries);
router.post('/:visitNoteId/entries', createVisitNoteEntry);

export default router;
