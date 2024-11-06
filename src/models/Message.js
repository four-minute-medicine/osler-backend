import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    user_prompt: {
        type: String,
        required: true,
    },
    user_type: {
        type: String,
        required: true,
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
});

export const Message = mongoose.model("Message", messageSchema);
