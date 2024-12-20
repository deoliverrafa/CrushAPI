import chatSocket from "./chatSocket.js";

export default function socketManager(io) {
  io.on("connection", (socket) => {
    console.log("Novo cliente conectado:", socket.id);

    // Eventos de chat
    chatSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
}
