import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import corsOptions from "./utils/corsOptions.js";

// Rotas
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import crushRoutes from "./routes/crushRoutes.js";
import messageRoutes from "./routes/messageRoute.js";

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);
app.use("/crush", crushRoutes);
app.use("/messages", messageRoutes);

export default app;