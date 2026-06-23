const Message = require("./src/models/message.model");
const User = require("./src/models/user.model");
require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/database");

const http = require("http");
const { Server } = require("socket.io");
const {
  extractTokenFromSocket,
  verifyToken,
} = require("./src/utils/token");

connectToDB();

const server = http.createServer(app);
const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  "https://support-chat-full-stack.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

let onlineUsers = [];

function normalizeUserPayload(user, unreadCount = 0) {
  return {
    userId: user._id.toString(),
    username: user.username,
    avatarUrl: user.avatarUrl || "",
    unreadCount,
  };
}

function getSocketsForUsername(username) {
  const user = onlineUsers.find((entry) => entry.username === username);

  return user?.socketIds || [];
}

async function buildOnlineUsersPayload(viewerUsername) {
  const [onlineUserDocs, unreadCounts] = await Promise.all([
    User.find({ _id: { $in: [...new Set(onlineUsers.map((user) => user.userId))] } }).select("_id username avatarUrl"),
    Message.aggregate([
      {
        $match: {
          receiver: viewerUsername,
          status: { $ne: "read" },
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const unreadMap = unreadCounts.reduce((accumulator, item) => {
    accumulator[item._id] = item.count;
    return accumulator;
  }, {});

  return onlineUserDocs.map((user) => normalizeUserPayload(user, unreadMap[user.username] || 0));
}

async function emitOnlineUsersToAll() {
  const viewers = [...new Set(onlineUsers.map((entry) => entry.username))];

  await Promise.all(
    viewers.map(async (viewerUsername) => {
      const payload = await buildOnlineUsersPayload(viewerUsername);

      getSocketsForUsername(viewerUsername).forEach((socketId) => {
        io.to(socketId).emit("online_users", payload);
      });
    })
  );
}

function emitMessageStatus(message, status) {
  const senderSockets = getSocketsForUsername(message.sender);

  if (!senderSockets.length) {
    return;
  }

  senderSockets.forEach((socketId) => {
    io.to(socketId).emit("message_status_update", {
      messageId: message._id,
      status: message.status,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
    });
  });
}

async function updateMessageStatus(messageId, actorUsername, nextStatus) {
  try {
    const message = await Message.findById(messageId);

    if (!message || message.receiver !== actorUsername) {
      return null;
    }

    if (nextStatus === "delivered") {
      if (message.status === "delivered" || message.status === "read") {
        return message;
      }

      message.status = "delivered";
      message.deliveredAt = message.deliveredAt || new Date();
    }

    if (nextStatus === "read") {
      if (message.status === "read") {
        return message;
      }

      message.status = "read";
      message.deliveredAt = message.deliveredAt || new Date();
      message.readAt = message.readAt || new Date();
    }

    await message.save();
    emitMessageStatus(message, nextStatus);
    emitOnlineUsersToAll().catch((error) => {
      console.error("Failed to refresh online users:", error.message);
    });

    return message;
  } catch (error) {
    console.error(`Failed to update message status to ${nextStatus}:`, error.message);
    return null;
  }
}

function emitOnlineUsers() {
  emitOnlineUsersToAll().catch((error) => {
    console.error("Failed to emit online users:", error.message);
  });
}

async function setPresence(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? null : new Date(),
    });
  } catch (error) {
    console.error("Presence update failed:", error.message);
  }
}

function addSocketConnection(socket) {
  const { id: userId, username } = socket.user;

  const existing = onlineUsers.find((user) => user.userId === userId);

  if (existing) {
    if (!existing.socketIds.includes(socket.id)) {
      existing.socketIds.push(socket.id);
    }
    return;
  }

  onlineUsers.push({
    userId,
    username,
    socketIds: [socket.id],
  });
}

function removeSocketConnection(socketId) {
  onlineUsers = onlineUsers
    .map((user) => ({
      ...user,
      socketIds: user.socketIds.filter((id) => id !== socketId),
    }))
    .filter((user) => user.socketIds.length > 0);
}

io.use(async (socket, next) => {
  try {
    const token = extractTokenFromSocket(socket);

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    socket.user = verifyToken(token);
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  // User Join
  socket.on("user_join", () => {
    addSocketConnection(socket);
    setPresence(socket.user.id, true);
    emitOnlineUsers();

  });

  addSocketConnection(socket);
  setPresence(socket.user.id, true);
  emitOnlineUsers();

  // Private Message
  socket.on("send_message", async (data) => {

    try {
      const sender = socket.user.username;
      const receiver = typeof data.receiver === "string" ? data.receiver.trim() : "";
      const text = typeof data.text === "string" ? data.text.trim() : "";

      if (!receiver) {
        return;
      }

      const newMessage = await Message.create({
        sender,
        receiver,
        text,
        fileUrl: data.fileUrl || "",
        fileType: data.fileType || "",
        fileName: data.fileName || "",
        status: "sent",
      });

      const receiverUser = onlineUsers.find(
        (user) =>
          user.username === receiver
      );

      // Receiver ko message
      if (receiverUser) {

        receiverUser.socketIds.forEach((socketId) => io.to(socketId).emit(
          "receive_message",
          newMessage
        ));

      }

      // Sender ko bhi message dikhe
      socket.emit(
        "receive_message",
        newMessage
      );

      emitOnlineUsers();

    } catch (err) {
      console.log(err);
    }

  });

  socket.on("message_delivered", async ({ messageId }) => {
    if (!messageId) {
      return;
    }

    await updateMessageStatus(messageId, socket.user.username, "delivered");
  });

  socket.on("messages_seen", async ({ messageIds = [] }) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(messageIds.filter(Boolean))];

    for (const messageId of uniqueIds) {
      await updateMessageStatus(messageId, socket.user.username, "read");
    }
  });

  // Typing Indicator
  socket.on("typing", () => {

    socket.broadcast.emit(
      "user_typing",
      `${socket.user.username} is typing...`
    );

  });

  // Disconnect
  socket.on("disconnect", async () => {

    removeSocketConnection(socket.id);

    if (!onlineUsers.some((user) => user.userId === socket.user.id)) {
      await setPresence(socket.user.id, false);
    }

    emitOnlineUsers();

    console.log(
      "User Disconnected"
    );

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});