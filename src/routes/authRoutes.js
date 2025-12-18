import { Router } from "express";
import { login, logout, refresh, validate } from "../../controllers/authController.js";
import { requireAuth } from "../../middleware/requireAuth.js";
const router = Router();

router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', requireAuth, validate)



export default router;
