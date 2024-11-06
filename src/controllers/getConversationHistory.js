// Model
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

export const getConversationHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findById(id);

        const messages = await Message.find({ conversation: id });

        res.status(200).json({ conversation, messages });
    } catch (error) {
        console.log(">>> Error", error);
        res.status(500).json({ error: error.message });
    }
};
