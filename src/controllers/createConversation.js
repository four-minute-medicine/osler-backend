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

// Cheerio
import * as cheerio from "cheerio";

// Mammoth
import mammoth from "mammoth";

import fs from "fs";

export const createConversation = async (req, res) => {
    try {
        const { question } = req.body;

        const downloadFileFromURL = async (url) => {
            const response = await axios.get(url, {
                responseType: "text",
            });
            return response.data;
        };

        const files = [
            process.env.S3_BUCKET_URI_SCRIPT,
            process.env.S3_BUCKET_URI_SUMMARY,
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

        const prompt = await Prompt.findOne({ name: "MediBotPrompt" });
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

        const truncatedQuestion =
            question.length > 20 ? question.substring(0, 20) + "..." : question;

        const conversation = await new Conversation({
            title: truncatedQuestion,
        }).save();

        const studentMessage = await new Message({
            user_prompt: question,
            user_type: "student",
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
            messages: [
                { user_type: "student", message: question },
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
