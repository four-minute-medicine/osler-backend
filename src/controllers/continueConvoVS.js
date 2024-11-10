// Model
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Prompt } from "../models/Prompt.js";

// Qdrant Vector Store
import { vectorStore } from "../config/vectorStoreClient.js";

// LlamaIndex
import { Document, VectorStoreIndex, ContextChatEngine } from "llamaindex";
import { Groq } from "@llamaindex/groq";

// Axios
import axios from "axios";

export const continueConvoVS = async (req, res, userType) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        const conversation = await Conversation.findById(id);
        const conversationHistory = await Message.find({
            conversation: id,
        }).select("-conversation -_id");
        const historyContext = conversationHistory.map((message) => ({
            role: message.user_type === "student" ? "Student" : "assistant",
            content: message.user_prompt,
        }));

        const downloadFileFromURL = async (url) => {
            const response = await axios.get(url, {
                responseType: "text",
            });
            return response.data;
        };

        const files = [
            // process.env.S3_BUCKET_URI_BOOKLET,
            process.env.S3_BUCKET_URI_INFO_ONE,
            process.env.S3_BUCKET_URI_INFO_TWO,
            process.env.S3_BUCKET_URI_INFO_THREE,
        ];

        const documents = await Promise.all(
            files.map(async (fileUrl) => {
                const textContent = await downloadFileFromURL(fileUrl);
                return textContent;
            })
        );

        const document = new Document({ text: documents });
        const index = await VectorStoreIndex.fromDocuments([document], {
            vectorStore,
        });
        const retriever = index.asRetriever({ similarityTopK: 5 });

        const prompt = await Prompt.findOne({ name: "VirtualPatientSimulator" });

        const chatEngine = new ContextChatEngine({
            retriever: retriever,
            systemPrompt: `Please still remember` + prompt.content,
            chatHistory: historyContext,
            chatModel: new Groq({
                apiKey: process.env.GROQ_API_KEY,
                model: process.env.LLAMA_MODEL,
                temperature: 0.7,
            }),
        });

        const response = await chatEngine.chat({
            message: question,
            stream: false,
        });

        const studentMessage = await new Message({
            user_prompt: question,
            user_type: "VirtualPatientSimulator",
            conversation: conversation._id,
        }).save();

        const botMessage = await new Message({
            user_prompt: response,
            user_type: "assistant",
            conversation: conversation._id,
        }).save();

        conversation.messages.push(studentMessage._id, botMessage._id);
        await conversation.save();

        res.json({
            messages: [
                { user_type: "VirtualPatientSimulator", message: question },
                {
                    user_type: "assistant",
                    message: response.message.content,
                },
            ],
        });
    } catch (error) {
        console.log(">>> Error");
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

export const continueParentConversation = (req, res) => {
    continueConversation(req, res, "parent");
};

export const continueHcwConversation = (req, res) => {
    continueConversation(req, res, "hcw");
};

export const continueVirtualPatientConversation = (req, res) => {
    continueConversation(req, res, "virtual_patient");
};
