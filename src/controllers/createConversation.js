// Model
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

// LlamaIndex
import {
    Document,
    QdrantVectorStore,
    VectorStoreIndex,
    ContextChatEngine,
} from "llamaindex";
import { Groq } from "@llamaindex/groq";

export const createConversation = async (req, res) => {
    try {
        const { question } = req.body;

        const vectorStore = new QdrantVectorStore({
            url: process.env.QDRANT_URL || "http://localhost:6333",
        });

        const essay = `In college, the author majored in Computer Science and was actively involved in various projects. 
                They worked on developing a mobile application that aimed to improve student engagement on campus. 
                Additionally, they participated in hackathons, where they 
                collaborated with peers to create innovative solutions for real-world problems.`;
        const document = new Document({ text: essay });
        const index = await VectorStoreIndex.fromDocuments([document], {
            vectorStore,
        });
        const retriever = index.asRetriever({ similarityTopK: 5 });

        const chatEngine = new ContextChatEngine({
            retriever: retriever,
            chatModel: new Groq({
                apiKey: process.env.GROQ_API_KEY,
                model: process.env.LLAMA_MODEL,
                temperature: 0.7,
            }),
            systemPrompt: `You are a helpful assistant named MediBot. You cater to medical students, trainees,
                and educators who are looking to learn medicine through an EdTech company called Four Minute Medicine.
                Four Minute Medicine is a South African-based company that aims to revolutionize medical education.
                Four Minute Medicine offers different courses across different spectrums for medical students, trainees,
                and educators. You are a QnA chatbot that answers questions from the context given.
                Keep your response grounded in the context only. If you are asked to assist with any
                medical education related content, then answer to the best of your ability, ignoring the context,
                while keeping it friendly. Keep your responses concise. Add emojis where appropriate.
                Answer the question based only on the provided information.`,
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
        console.log(">>> Error", error);
        res.status(500).json({ error: error.message });
    }
};
