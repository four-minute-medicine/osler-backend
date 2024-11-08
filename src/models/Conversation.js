import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    user: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const Conversation = mongoose.model("Conversation", conversationSchema);
