import { Router } from "express";
import { createProvider, deleteProvider, getAllProviders, getProvider, updateProvider, getProviderByUserId } from "../../controllers/providersController.js";

const router = Router();

router.get('/:id', getProvider);
router.get('/user/:id', getProviderByUserId);
router.get("/", getAllProviders);
router.post('/', createProvider);
router.put('/:id', updateProvider);
router.delete('/:id', deleteProvider);

export default router;
