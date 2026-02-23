import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
