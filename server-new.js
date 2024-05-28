const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

let sessions = {};
let adminId = null;

wss.on("connection", (ws) => {
  const userId = uuidv4();
  sessions[userId] = { socket: ws, name: null, card: null };

  if (!adminId) {
    adminId = userId;
    sessions[userId].isAdmin = true;
  } else {
    sessions[userId].isAdmin = false;
  }

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "setName") {
      sessions[userId].name = data.name;
      ws.send(
        JSON.stringify({
          type: "nameSet",
          userId,
          name: data.name,
          isAdmin: sessions[userId].isAdmin,
        })
      );
      broadcast({ type: "userJoined", userId, name: data.name });
    }

    if (data.type === "card") {
      sessions[userId].card = data.card;
      broadcast({
        type: "card",
        userId,
        name: sessions[userId].name,
        card: data.card,
      });
    }

    if (data.type === "reveal" && sessions[userId].isAdmin) {
      const cards = Object.keys(sessions).map((id) => ({
        userId: id,
        name: sessions[id].name,
        card: sessions[id].card,
      }));
      broadcast({ type: "reveal", cards });
    }
  });

  ws.on("close", () => {
    const user = sessions[userId];
    delete sessions[userId];
    if (user.name) {
      broadcast({ type: "userDisconnected", userId, name: user.name });
    }
    if (user.isAdmin) {
      const userIds = Object.keys(sessions);
      if (userIds.length > 0) {
        adminId = userIds[0];
        sessions[adminId].isAdmin = true;
        sessions[adminId].socket.send(
          JSON.stringify({ type: "adminAssigned" })
        );
      } else {
        adminId = null;
      }
    }
  });
});

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
