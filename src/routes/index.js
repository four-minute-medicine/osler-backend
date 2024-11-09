import express from "express";

// Controllers
import {
    createParentConversation,
    createHcwConversation,
    createVirtualPatientConversation,
} from "../controllers/createConversation.js";
import {
    continueParentConversation,
    continueHcwConversation,
    continueVirtualPatientConversation,
} from "../controllers/continueConversation.js";
import { getConversationHistory } from "../controllers/getConversationHistory.js";
import { getConversations } from "../controllers/getConversations.js";

const router = express.Router();

router.post("/api/conversation/parent", createParentConversation);
router.post("/api/conversation/hcw", createHcwConversation);
router.post(
    "/api/conversation/virtual-patient",
    createVirtualPatientConversation
);
router.put("/api/conversation/parent/:id", continueParentConversation);
router.put("/api/conversation/hcw/:id", continueHcwConversation);
router.put(
    "/api/conversation/virtual-patient/:id",
    continueVirtualPatientConversation
);
router.get("/api/conversation/:id", getConversationHistory);
router.get("/api/conversation", getConversations);

export default router;
