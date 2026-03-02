import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initSocket } from "./config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Inicializar Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor StayAS corriendo en http://localhost:${PORT}`);
});
