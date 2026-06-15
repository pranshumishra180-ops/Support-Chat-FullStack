import "../styles/Chat.css";
import "../styles/Theme.css";
import { useEffect, useState, useRef } from "react";
import socket from "../services/socket";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Avatar from "../components/Avatar";
import EmojiPicker from "../components/EmojiPicker";
import ProfilePhotoUpload from "../components/ProfilePhotoUpload";
import { useTheme } from "../components/ThemeProvider";

function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState(
    localStorage.getItem("selectedUser") || null
  );
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || {});

  const getMediaUrl = (fileUrl = "") => {
    if (!fileUrl) {
      return "";
    }

    if (
      /^https?:\/\//i.test(fileUrl) ||
      fileUrl.startsWith("blob:") ||
      fileUrl.startsWith("data:")
    ) {
      return fileUrl;
    }

    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

    return `${apiBase}/${fileUrl.replace(/^\/+/, "")}`;
  };

  const isImageFile = (fileType = "", fileUrl = "") => {
    if (fileType) {
      return fileType.startsWith("image/");
    }

    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileUrl);
  };

  const getMessageStatusText = (status = "sent") => {
    if (status === "read") {
      return "✓✓";
    }

    if (status === "delivered") {
      return "✓✓";
    }

    return "✓";
  };

  const getMessageStatusColor = (status = "sent") => {
    if (status === "read") {
      return "#3b82f6";
    }

    if (status === "delivered") {
      return "#9ca3af";
    }

    return "#9ca3af";
  };

  const logout = () => {
    api.post("/api/auth/logout").finally(() => {
      localStorage.removeItem("user");
      localStorage.removeItem("selectedUser");
      navigate("/");
    });
  };

  const selectedUserAvatar = selectedUserProfile?.avatarUrl || "";

  const currentUserAvatar = user.avatarUrl || "";

  const updateCachedUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    socket.emit("profile_updated");
  };

  const fetchUserProfile = async (username) => {
    if (!username) {
      return null;
    }

    try {
      const response = await api.get(`/api/auth/${username}`);
      setSelectedUserProfile(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      setSelectedUserProfile(null);
      return null;
    }
  };

  const fetchPrivateMessages = async (receiver) => {
    try {
      const res = await api.get(
        `/api/messages?user1=${user.username}&user2=${receiver}`
      );

      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post(
        "/api/upload",
        formData
      );

      return res.data;
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchPrivateMessages(selectedUser);
      fetchUserProfile(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!user.username) {
      return undefined;
    }

    socket.emit("user_join");

    socket.on("receive_message", (data) => {
      if (
        (data.sender === user.username &&
          data.receiver === selectedUser) ||
        (data.sender === selectedUser &&
          data.receiver === user.username)
      ) {
        setMessages((prev) => [...prev, data]);

        if (data.receiver === user.username) {
          socket.emit("message_delivered", {
            messageId: data._id,
          });
        }
      }
    });

    socket.on("message_status_update", (payload) => {
      setMessages((currentMessages) =>
        currentMessages.map((msg) =>
          msg._id === payload.messageId
            ? {
                ...msg,
                status: payload.status || msg.status,
                deliveredAt: payload.deliveredAt || msg.deliveredAt,
                readAt: payload.readAt || msg.readAt,
              }
            : msg
        )
      );
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("user_typing", (data) => {
      setTyping(data);

      setTimeout(() => {
        setTyping("");
      }, 2000);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_status_update");
      socket.off("online_users");
      socket.off("user_typing");
    };
  }, [selectedUser, user.username]);

  useEffect(() => {
    if (!selectedUser || !user.username || messages.length === 0) {
      return;
    }

    const unreadMessageIds = messages
      .filter(
        (msg) =>
          msg.sender === selectedUser &&
          msg.receiver === user.username &&
          msg.status !== "read"
      )
      .map((msg) => msg._id);

    if (unreadMessageIds.length > 0) {
      socket.emit("messages_seen", {
        messageIds: unreadMessageIds,
      });
    }
  }, [messages, selectedUser, user.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (user.username && !user.avatarUrl) {
      api.get("/api/auth/profile").then((response) => {
        updateCachedUser(response.data);
      }).catch(() => {});
    }
  }, [user.username]);


  const deleteMessage = async (id) => {

  try {

    await api.delete(
      `/api/messages/${id}`
    );

    setMessages((currentMessages) =>
      currentMessages.filter((msg) => msg._id !== id)
    );

  } catch (err) {

    console.log(err);

  }

};

  const sendMessage = async () => {
    if (!selectedUser) {
      alert("Select a user first");
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage && !selectedFile)
      return;

    let fileData = null;

   if (selectedFile) {
  fileData = await uploadFile();

  console.log("Selected File =", selectedFile);
  console.log("File Data =", fileData);
}

    socket.emit("send_message", {
      sender: user.username,
      receiver: selectedUser,
      text: trimmedMessage,
      fileUrl: fileData?.fileUrl || "",
      fileType: fileData?.fileType || "",
      fileName: fileData?.fileName || "",
    });

    setMessage("");
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertEmoji = (emoji) => {
    setMessage((currentMessage) => `${currentMessage}${emoji}`);
    setShowEmojiPicker(false);
  };

  const getDisplayAvatar = (message) => {
    if (message.sender === user.username) {
      return currentUserAvatar;
    }

    return selectedUserAvatar;
  };

  return (
    <div className="chat-container">

      <div className="chat-header">
        <div className="chat-header-left">
          <Avatar name={selectedUser || user.username} src={selectedUserAvatar} size={44} />
          <div className="chat-header-meta">
            <h2>{selectedUser ? `Chat with ${selectedUser}` : "Select User"}</h2>
            <span className="chat-header-status">
              {selectedUserProfile?.isOnline
                ? "Online"
                : selectedUserProfile?.lastSeen
                  ? `Last seen ${new Date(selectedUserProfile.lastSeen).toLocaleString()}`
                  : "Offline"}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <ProfilePhotoUpload onUploaded={updateCachedUser} />
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isDarkMode ? "☀" : "☾"}
          </button>
          <button onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="online-users">

        <h4>Online Users</h4>

        {onlineUsers
          .filter(
            (u) =>
              u.username !== user.username
          )
          .map((u, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedUser(u.username);

                localStorage.setItem(
                  "selectedUser",
                  u.username
                );

                fetchPrivateMessages(
                  u.username
                );
              }}
              className="user-pill"
            >
              <div className="online-user-pill-content">
                <Avatar name={u.username} src={u.avatarUrl} size={34} />
                <span className="online-user-name">{u.username}</span>
              </div>
              {u.unreadCount > 0 ? (
                <span className="unread-badge">{u.unreadCount}</span>
              ) : null}
            </div>
          ))}
      </div>
        

  <div className="chat-messages">

        {typing && (
          <p className="typing-text">
            {typing}
          </p>
        )}

        {messages.map((msg) => {
          const mediaUrl = getMediaUrl(msg.fileUrl);
          const imageMessage = isImageFile(msg.fileType, mediaUrl);
          const messageAvatar = getDisplayAvatar(msg);

          return (
            <div
              key={msg._id}
              className={
                msg.sender === user.username
                  ? "my-message"
                  : "other-message"
              }
            >
              <div className="message-body">
                <Avatar name={msg.sender} src={messageAvatar} size={34} className="message-avatar" />

                <div className="message-content">
                  {msg.sender === user.username && (
                    <button
                      className="delete-btn"
                      onClick={() => deleteMessage(msg._id)}
                      aria-label="Delete message"
                    >
                      🗑
                    </button>
                  )}

                  <strong>{msg.sender}</strong>

                  {msg.text ? <p>{msg.text}</p> : null}

                  {msg.fileUrl ? (
                    imageMessage ? (
                      <img
                        src={mediaUrl}
                        alt={msg.fileName || "shared file"}
                        width="200"
                        className="chat-image"
                        onLoad={() => console.log("IMAGE LOADED")}
                        onError={() => console.log("IMAGE FAILED")}
                      />
                    ) : (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📎 {msg.fileName || "Download File"}
                      </a>
                    )
                  ) : null}
                </div>
              </div>

              <small className="message-time">
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
                {msg.sender === user.username ? (
                  <span
                    style={{
                      marginLeft: "6px",
                      color: getMessageStatusColor(msg.status),
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {getMessageStatusText(msg.status)}
                  </span>
                ) : null}
              </small>
            </div>
          );
        })}

        <div ref={messagesEndRef}></div>

      </div>

     { previewUrl && (
        <div className="image-preview">
          <img
            src={previewUrl}
            alt="preview"
          />

          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl("");
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            ✖
          </button>
        </div>
      )}

      <div className="chat-input">

        <label className="file-upload">
          📎

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => {
              const file =
                e.target.files[0];

              setSelectedFile(file);

              if (
                file &&
                file.type.startsWith(
                  "image"
                )
              ) {
                setPreviewUrl(
                  URL.createObjectURL(file)
                );
              } else {
                setPreviewUrl("");
              }
            }}
          />
        </label>

        <div className="emoji-picker-shell">
          <button
            type="button"
            className="emoji-trigger"
            onClick={() => setShowEmojiPicker((current) => !current)}
            aria-label="Open emoji picker"
          >
            😊
          </button>

          {showEmojiPicker ? (
            <EmojiPicker
              onSelect={insertEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          ) : null}
        </div>

        {selectedFile && (
          <span className="file-name">
            {selectedFile.name}
          </span>
        )}

        <input
          type="text"
          value={message}
          placeholder="Type a message..."
          onChange={(e) => {
            setMessage(e.target.value);

            socket.emit(
              "typing"
            );
          }}
        />

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}

export default Chat;