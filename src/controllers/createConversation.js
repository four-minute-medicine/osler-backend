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

export const createConversation = async (req, res, userType) => {
    try {
        const { question } = req.body;

        const downloadFileFromURL = async (url) => {
            const response = await axios.get(url, {
                responseType: "text",
            });
            return response.data;
        };

        const files = [
            process.env.S3_BUCKET_URI_BOOKLET,
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

        let prompt;
        if (userType === "parent") {
            prompt = await Prompt.findOne({ name: "Parents" });
        } else if (userType === "hcw") {
            prompt = await Prompt.findOne({ name: "HCW" });
        } else if (userType === "virtual_patient") {
            prompt = await Prompt.findOne({ name: "VirtualPatientSimulator" });
        }

        const chatEngine = new ContextChatEngine({
            retriever: retriever,
            systemPrompt: prompt.content,
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

        const generateTitle = async (question) => {
            const titleResponse = await chatEngine.chat({
                message: `Generate a title for the following question: ${question}`,
                stream: false,
            });
            return titleResponse.message.content;
        };

        const title = await generateTitle(question);
        const conversation = await new Conversation({
            title: title,
        }).save();

        const studentMessage = await new Message({
            user_prompt: question,
            user_type: userType,
            conversation: conversation._id,
        }).save();

        const botMessage = await new Message({
            user_prompt: response,
            user_type: "assistant",
            conversation: conversation._id,
        }).save();

        conversation.messages.push(studentMessage, botMessage);
        await conversation.save();

        res.json({
            conversationId: conversation._id,
            messages: [
                { user_type: userType, message: question },
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

export const createParentConversation = (req, res) => {
    createConversation(req, res, "parent");
};

export const createHcwConversation = (req, res) => {
    createConversation(req, res, "hcw");
};

export const createVirtualPatientConversation = (req, res) => {
    createConversation(req, res, "virtual_patient");
};
