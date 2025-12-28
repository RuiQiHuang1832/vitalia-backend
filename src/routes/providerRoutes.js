import { Router } from "express";
import { createProvider, deleteProvider, getAllProviders, getProvider, getProviderByUserId, updateProvider } from "../../controllers/providersController.js";
import { requireRole } from "../../middleware/requireRole.js";
const router = Router();

router.get('/:id', requireRole("ADMIN", "PROVIDER", "PATIENT"), getProvider);
router.get('/user/:id', requireRole("ADMIN", "PROVIDER", "PATIENT"), getProviderByUserId);
router.get("/", requireRole("ADMIN", "PROVIDER", "PATIENT"), getAllProviders);
router.post('/', requireRole("ADMIN"), createProvider);
router.put('/:id', requireRole("ADMIN"), updateProvider);
router.delete('/:id', requireRole("ADMIN"), deleteProvider);

export default router;
