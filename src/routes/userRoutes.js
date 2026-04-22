import { Router } from "express";
import { getAllUsers, updateUserStatus } from "../../controllers/usersController.js";

const router = Router();

router.get("/", getAllUsers);
router.patch("/:userId/status", updateUserStatus);

export default router;
