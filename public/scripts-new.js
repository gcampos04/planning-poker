let userId;
let userName;
let isAdmin = false;
const ws = new WebSocket("ws://" + window.location.host);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "nameSet") {
    userId = data.userId;
    userName = data.name;
    isAdmin = data.isAdmin;
    document.getElementById("nameInputSection").classList.remove("active");
    document.getElementById("session").classList.add("active");
    addPlayer(userId, userName, isAdmin);

    if (isAdmin) {
      document.getElementById("revealButton").style.display = "block";
    } else {
      document.getElementById("revealButton").style.display = "none";
    }
  }

  if (data.type === "adminAssigned") {
    if (!isAdmin) {
      isAdmin = true;
      document.getElementById("revealButton").style.display = "block";
    }
  }

  if (data.type === "userJoined") {
    addPlayer(data.userId, data.name);
  }

  if (data.type === "card") {
    const playerCard = document.getElementById(`player-card-${data.userId}`);
    if (playerCard) {
      playerCard.textContent = data.card;
    }
  }

  if (data.type === "reveal") {
    data.cards.forEach((card) => {
      const playerCard = document.getElementById(`player-card-${card.userId}`);
      if (playerCard) {
        playerCard.textContent = card.card;
      }
    });
  }

  if (data.type === "userDisconnected") {
    const player = document.getElementById(`player-${data.userId}`);
    if (player) {
      player.remove();
    }
  }
};

function setName() {
  const name = document.getElementById("name").value;
  if (name) {
    ws.send(JSON.stringify({ type: "setName", name }));
  }
}

function sendCard(card) {
  ws.send(JSON.stringify({ type: "card", card }));
}

function revealCards() {
  if (isAdmin) {
    ws.send(JSON.stringify({ type: "reveal" }));
  }
}

function addPlayer(userId, userName, isAdmin = false) {
  if (document.getElementById(`player-${userId}`)) {
    return; // Avoid adding the same player twice
  }

  const playersContainer = document.getElementById("players");
  const playerDiv = document.createElement("div");
  playerDiv.className = "player";
  playerDiv.id = `player-${userId}`;

  const playerName = document.createElement("div");
  playerName.className = "name";
  playerName.textContent = userName;

  const playerCard = document.createElement("div");
  playerCard.className = "card";
  playerCard.id = `player-card-${userId}`;

  playerDiv.appendChild(playerName);
  playerDiv.appendChild(playerCard);
  playersContainer.appendChild(playerDiv);
}
