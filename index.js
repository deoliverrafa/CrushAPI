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

// Configuração do Socket.IO
const corsOptions = {
  origin: ["http://localhost:5173", "https://crushif.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

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

const io = new SocketIO(server, {
  cors: {
    origin: ["http://localhost:5173", "https://crushif.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
});

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

  socket.on("joinChatRoom", (userId1, userId2) => {
    const roomId = [userId1, userId2].sort().join("_");

    if (!chatRooms[roomId]) {
      chatRooms[roomId] = [userId1, userId2];
    }

    socket.join(roomId);

    socket.emit("roomJoined", roomId);
  });

  // Entrar na sala de chat
  socket.on("joinRoom", ({ senderId, receiverId }) => {
    try {
      const roomName = [senderId, receiverId].sort().join("-");
      socket.join(roomName);
      chatRooms[socket.id] = roomName;
    } catch (error) {
      console.error("Erro ao entrar na sala", error);
    }
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

  // socket.on("markAsRead", async ({ senderId, receiverId }) => {
  //   try {
  //     await Message.updateMany(
  //       { senderId, receiverId, status: "sent" },
  //       { $set: { status: "read" } }
  //     );

  //     io.to(senderId).emit("messagesUpdated", { receiverId });
  //   } catch (error) {
  //     console.error("Erro ao marcar mensagens como lidas", error);
  //   }
  // });

  // socket.on("messageRead", async ({ senderId, receiverId }) => {
  //   try {
  //     const updatedMessages = await Message.updateMany(
  //       {
  //         senderId,
  //         receiverId,
  //         status: { $in: ["sent", "received"] },
  //       },
  //       { status: "read" }
  //     );
  //     if (updatedMessages.modifiedCount > 0) {
  //       io.to(userSockets[senderId]).emit("messagesUpdated", {
  //         receiverId,
  //         status: "read",
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Erro ao atualizar status para 'read':", err);
  //   }
  // });

  socket.on("messageReceived", async (messageId) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { status: "received" },
        { new: true }
      );
      if (message) {
        io.to(userSockets[message.senderId]).emit("messageStatusUpdated", {
          messageId: message._id,
          status: "received",
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar status para 'received':", err);
    }
  });

  // socket.on("messageRead", async (messageId) => {
  //   try {
  //     console.log("Id mensagem",messageId);
      
  //     const message = await Message.findByIdAndUpdate(
  //       messageId,
  //       { status: "read" },
  //       { new: true }
  //     );
  //     console.log(message)
  //     if (message) {
  //       io.to(userSockets[message.senderId]).emit("messageReadStatus", {
  //         messageId: message._id,
  //         status: "read",
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Erro ao atualizar status para 'read':", err);
  //   }
  // });

  socket.on("markMessagesAsRead", async ({ senderId, receiverId }) => {
    const roomName = [senderId, receiverId].sort().join("-");

    // Verificar se o socket está na sala correta
    if (chatRooms[socket.id] === roomName) {
      try {
        // Marcar mensagens como lidas no banco de dados
        await Message.updateMany(
          { senderId: receiverId, receiverId: senderId, status: "received" },
          { status: "read" }
        );

        // Emitir um evento para atualizar o status no front-end
        io.to(roomName).emit("messagesUpdated", {
          receiverId: senderId,
          status: "read",
        });
      } catch (error) {
        console.error("Erro ao marcar mensagens como lidas:", error);
      }
                }
  });

  // Remover o usuário do mapeamento quando desconectar
  socket.on("disconnect", () => {
    for (const [userId, sockets] of Object.entries(userSockets)) {
      userSockets[userId] = sockets.filter((id) => id !== socket.id);
      if (userSockets[userId].length === 0) {
        delete userSockets[userId];
      }
    }
    delete chatRooms[socket.id];
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
