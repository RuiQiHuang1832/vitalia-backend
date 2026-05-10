import { Router } from "express";
import {
  createOrGetConversation,
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendMessage,
} from "../../controllers/conversationController.js";

const router = Router();

router.get("/", listConversations);
router.post("/", createOrGetConversation);
router.get("/:id/messages", listConversationMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/read", markConversationRead);

export default router;
