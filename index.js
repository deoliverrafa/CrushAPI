// Dependências e imports
import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIO } from "socket.io";
import cors from "cors";
import Message from "./messageSchema.js";

// Configuração do dotenv
dotenv.config();

// Importação das rotas
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import postRoutes from "./postRoutes.js";
import commentRoutes from "./commentRoutes.js";
import crushRoutes from "./crushRoutes.js";
import messageRoutes from "./messageRoute.js";

// Inicialização do app e do servidor HTTP
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: ["http://localhost:5173", "https://crushif.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new SocketIO(server, {
  cors: {
    origin: ["http://localhost:5173", "https://crushif.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
});

// Configuração do CORS
app.use(cors(corsOptions));

// Middleware para JSON
app.use(express.json());

// Configuração das rotas da API
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);
app.use("/crush", crushRoutes);
app.use("/messages", messageRoutes);

// Mapeia as salas com base no userId
const userSockets = {}; // Para armazenar os socket ids
const chatRooms = {}; // Para armazenar as salas de chat

io.on("connection", (socket) => {
  // Registrar os usuários e colocá-los em uma sala de chat específica

  socket.on("register", (userId) => {
    if (!userSockets[userId]) {
      userSockets[userId] = [];
    }
    userSockets[userId].push(socket.id);
  });

  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomName = [senderId, receiverId].sort().join("-");
    socket.join(roomName);

    // Rastrear os usuários conectados na sala
    if (!activeUsersInRooms[roomName]) {
      activeUsersInRooms[roomName] = new Set();
    }
    activeUsersInRooms[roomName].add(senderId);

    chatRooms[socket.id] = roomName;
  });

  socket.on("sendMessage", async (message) => {
    try {
      const roomId = [message.senderId, message.receiverId].sort().join("_");
      const savedMessage = await Message.create(message);
      io.to(roomId).emit("newMessage", savedMessage);
    } catch (error) {
      console.error("Erro ao salvar ou enviar mensagem:", error);
    }
  });


  socket.on("markMessagesAsRead", async ({ senderId, receiverId }) => {
    const roomName = [senderId, receiverId].sort().join("-");

    // Verificar se o destinatário está ativo na sala
    if (activeUsersInRooms[roomName] && activeUsersInRooms[roomName].has(receiverId)) {
      try {
        await Message.updateMany(
          { senderId: receiverId, receiverId: senderId, status: "sent" },
          { status: "read" }
        );
        
        // Atualizar mensagens no front-end
        io.to(roomName).emit("messagesUpdated", { receiverId: senderId });
      } catch (error) {
        console.error("Erro ao marcar mensagens como lidas:", error);
      }
    }
  });

  // Remover o usuário do mapeamento quando desconectar
  socket.on("disconnect", () => {
    const roomName = chatRooms[socket.id];
    if (roomName && activeUsersInRooms[roomName]) {
      activeUsersInRooms[roomName].delete(senderId);
    }
    delete chatRooms[socket.id];
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
