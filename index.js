import express from "express";
import cors from "cors";

// Mongoose
import mongoose from "mongoose";

// Config
import "./src/config/dotenv.js";

// Routes
import chatRoutes from "./src/routes/index.js";

// Dotenv
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(chatRoutes);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log("Connected to MongoDB🚀");
            console.log(`🚀 Osler Server Started on PORT ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB");
        console.error(error);
    });
