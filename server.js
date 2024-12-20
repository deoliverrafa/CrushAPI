import http from "http";
import { Server as SocketIO } from "socket.io";
import app from "./app.js";
import socketManager from "./sockets/socketManager.js";

const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: ["http://localhost:5173", "https://crushif.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

socketManager(io);

const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});