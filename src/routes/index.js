import express from "express";

// Controllers
import { createConvoHCW } from "../controllers/createConvoHCW.js";
import { createConvoParent } from "../controllers/createConvoParent.js";
import { createConvoVS } from "../controllers/createConvoVS.js";

import { continueConvoParent } from "../controllers/continueConvoParent.js";
import { continueConvoHCW } from "../controllers/continueConvoHCW.js";
import { continueConvoVS } from "../controllers/continueConvoVS.js";

import { getConversationHistory } from "../controllers/getConversationHistory.js";
import { getConversations } from "../controllers/getConversations.js";

const router = express.Router();

router.post("/api/conversation/hcw", createConvoHCW);
router.post("/api/conversation/parent", createConvoParent);
router.post("/api/conversation/virtual-patient", createConvoVS);

router.put("/api/conversation/parent/:id", continueConvoParent);
router.put("/api/conversation/hcw/:id", continueConvoHCW);
router.put("/api/conversation/virtual-patient/:id", continueConvoVS);

router.get("/api/conversation/:id", getConversationHistory);
router.get("/api/conversation", getConversations);

export default router;
