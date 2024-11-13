// Dependências e imports
import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import Message from './messageSchema.js'

// Configuração do dotenv
dotenv.config();

// Importação das rotas
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import postRoutes from "./postRoutes.js";
import commentRoutes from './commentRoutes.js';
import crushRoutes from './crushRoutes.js';
import messageRoutes from './messageRoute.js';

// Inicialização do app e do servidor HTTP
const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new SocketIO(server, {});

// Configuração do CORS
app.use(cors());

// Middleware para JSON
app.use(express.json());

// Configuração das rotas da API
app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);
app.use('/crush', crushRoutes);
app.use('/messages', messageRoutes)

// Mapeia as salas com base no userId
const userSockets = {};  // Para armazenar os socket ids
const chatRooms = {};  // Para armazenar as salas de chat

io.on('connection', (socket) => {
    // Registrar os usuários e colocá-los em uma sala de chat específica
    socket.on('register', (userId) => {
        if (!userSockets[userId]) {
            userSockets[userId] = [];
        }
        userSockets[userId].push(socket.id);
    });

    // Função para criar uma sala de chat entre dois usuários
    socket.on('joinChatRoom', (userId1, userId2) => {
        // Criar uma chave única para a sala (usando userIds combinados)
        const roomId = [userId1, userId2].sort().join('_');  // Garante uma chave única

        // Verificar se a sala já existe, se não, cria
        if (!chatRooms[roomId]) {
            chatRooms[roomId] = [userId1, userId2];
        }

        // Adicionar os sockets dos dois usuários na sala
        socket.join(roomId);

        // Emitir para o cliente que ele entrou na sala
        socket.emit('roomJoined', roomId);
    });

    // Enviar mensagem para todos os usuários na sala
    socket.on('sendMessage', async (message) => {
        const { senderId, receiverId, content } = message;
        // Criação da chave única para a sala com base no userId
        const roomId = [senderId, receiverId].sort().join('_');
        
        try {
            // Salvar a mensagem no banco de dados
            const newMessage = new Message({
                senderId: senderId,
                receiverId: receiverId,
                content: content,
                status: 'sent',
            });
            
            await newMessage.save();


            // Emitir a mensagem para todos os usuários na sala (somente os dois usuários)
            io.to(roomId).emit('newMessage', newMessage);

            // Emitir a resposta ao cliente que enviou a mensagem (se necessário)
            socket.emit('messageSent', newMessage);
        } catch (error) {
            console.error('Erro ao enviar a mensagem:', error);
            socket.emit('error', 'Erro ao enviar a mensagem');
        }
    });

    // Remover o usuário do mapeamento quando desconectar
    socket.on('disconnect', () => {
        for (let userId in userSockets) {
            const index = userSockets[userId].indexOf(socket.id);
            if (index !== -1) {
                userSockets[userId].splice(index, 1); // Remove o socket desconectado

                // Remover o socket de todas as salas associadas
                for (let roomId in chatRooms) {
                    if (chatRooms[roomId].includes(userId)) {
                        socket.leave(roomId);
                    }
                }
            }
        }
    });
});

// Inicialização do servidor
const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
