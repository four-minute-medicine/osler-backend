// models/Prompt.js
import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

export const Prompt = mongoose.model("Prompt", promptSchema);
