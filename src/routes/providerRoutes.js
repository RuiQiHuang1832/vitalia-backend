import { Router } from "express";
import { createProvider, deleteProvider, getAllProviders, getProvider, updateProvider } from "../../controllers/providersController.js";

const router = Router();

router.get('/:id', getProvider);
router.get("/", getAllProviders);
router.post('/', createProvider);
router.put('/:id', updateProvider);
router.delete('/:id', deleteProvider);

export default router;
