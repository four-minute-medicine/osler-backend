import express from "express";

// Controller
import { createConversation } from "../controllers/createConversation.js";
import { continueConversation } from "../controllers/continueConversation.js";
import { getConversationHistory } from "../controllers/getConversationHistory.js";
import { getConversations } from "../controllers/getConversations.js";

const router = express.Router();

router.post("/api/conversation", createConversation);
router.put("/api/conversation/:id", continueConversation);
router.get("/api/conversation/:id", getConversationHistory);
router.get("/api/conversation", getConversations);

export default router;
