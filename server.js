import http from "http";
import { Server as SocketIO } from "socket.io";
import app from "./app.js";
import socketManager from "./sockets/socketManager.js";
import corsOptions from "./utils/corsOptions.js";

const server = http.createServer(app);

const io = new SocketIO(server, corsOptions);

socketManager(io);

const PORT = process.env.PORT || 4040;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
