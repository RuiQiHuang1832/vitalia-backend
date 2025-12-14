import { Router } from "express";
import { createProviderAvailability, getProviderAvailability, updateProviderAvailability } from "../../controllers/providerAvailabilityController.js";
const router = Router();

router.post("/", createProviderAvailability);
router.get("/:id", getProviderAvailability);
router.put("/:id", updateProviderAvailability);



export default router;
