import { Router } from "express";
import { login, refresh , logout} from "../../controllers/authController.js";
const router = Router();

router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)



export default router;
