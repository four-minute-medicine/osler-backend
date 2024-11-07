// Model
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Prompt } from "../models/Prompt.js";

// Qdrant Vector Store
import { vectorStore } from "../config/vectorStoreClient.js";

// LlamaIndex
import { Document, VectorStoreIndex, ContextChatEngine } from "llamaindex";
import { Groq } from "@llamaindex/groq";

import mammoth from "mammoth";
import { exec } from "child_process";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

export const continueConversation = async (req, res) => {
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
                responseType: "arraybuffer",
            });
            return response.data;
        };

        const parseDocx = async (file) => {
            const result = await mammoth.extractRawText({ buffer: file });
            return result.value;
        };

        const downloadTextFromWebPage = async (url) => {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            return $("body").text();
        };

        const parseKeyOrPages = async (filePath) => {
            return new Promise((resolve, reject) => {
                exec(
                    `textutil -convert txt -stdout "${filePath}"`,
                    (error, stdout, stderr) => {
                        if (error) {
                            reject(`Error parsing file: ${stderr}`);
                        } else {
                            resolve(stdout);
                        }
                    }
                );
            });
        };

        const files = [
            process.env.S3_BUCKET_URI_DOCX,
            process.env.S3_BUCKET_URI_DOCX_1,
            process.env.S3_BUCKET_URI_KEY,
            process.env.S3_BUCKET_URI_PAGES,
            process.env.S3_BUCKET_URI_WIKI_1,
            process.env.S3_BUCKET_URI_WIKI_2,
            process.env.S3_BUCKET_URI_WIKI_3,
            process.env.S3_BUCKET_URI_WIKI_4,
            process.env.S3_BUCKET_URI_WIKI_5,
            process.env.S3_BUCKET_URI_WIKI_6,
            process.env.S3_BUCKET_URI_WIKI_7,
        ];

        const documents = await Promise.all(
            files.map(async (fileUrl) => {
                const file = await downloadFileFromURL(fileUrl);
                let parsedDocument;

                if (fileUrl.endsWith(".docx")) {
                    parsedDocument = await parseDocx(file);
                } else if (
                    fileUrl.endsWith(".key") ||
                    fileUrl.endsWith(".pages")
                ) {
                    const localFilePath = `/tmp/${fileUrl.split("/").pop()}`;
                    fs.writeFileSync(localFilePath, file);
                    parsedDocument = await parseKeyOrPages(localFilePath);
                } else {
                    parsedDocument = await downloadTextFromWebPage(fileUrl);
                }

                return parsedDocument;
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
            user_type: "student",
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
                { user_type: "student", message: question },
                {
                    user_type: "assistant",
                    message: response.message.content,
                },
            ],
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
