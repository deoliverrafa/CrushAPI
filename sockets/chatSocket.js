import Message from "../schemas/messageSchema.js";


export default function chatSocket(io, socket) {
  socket.on("joinChatRoom", (userId1, userId2) => {
    const roomId = [userId1, userId2].sort().join("_");
    socket.join(roomId);
    socket.to(roomId).emit("userEntered", { userId: userId1, roomId });
    socket.emit("roomJoined", roomId);
  });

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
      
      const messageToSave = {
        ...message,
        status: 'received'
      }

      const savedMessage = await Message.create(messageToSave);
      
      io.to(roomId).emit("newMessage", savedMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  });

  socket.on("markMessagesAsRead", async ({ senderId, receiverId }) => {
    const roomName = [senderId, receiverId].sort().join("-");
    await Message.updateMany(
      { senderId: receiverId, receiverId: senderId, status: "received" },
      { status: "read" }
    );

    io.to(roomName).emit("messagesUpdated", {
      receiverId: senderId,
      status: "read",
    });
  });
}