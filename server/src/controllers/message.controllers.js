const Message = require("../models/message.model");
const fs = require("fs/promises");
const path = require("path");

const uploadDirs = [
  path.join(__dirname, "..", "..", "uploads"),
  path.join(__dirname, "..", "..", "uploads.js"),
];

async function removeStoredFile(fileUrl) {
  if (!fileUrl) {
    return;
  }

  try {
    let fileName = "";

    try {
      const parsedUrl = new URL(fileUrl);
      fileName = path.basename(parsedUrl.pathname);
    } catch (urlError) {
      fileName = path.basename(fileUrl);
    }

    if (!fileName) {
      return;
    }

    for (const uploadDir of uploadDirs) {
      try {
        await fs.unlink(path.join(uploadDir, fileName));
        return;
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to remove uploaded file:", error);
    }
  }
}

async function getMessages(req, res) {

  try {

    const { user1, user2 } = req.query;
    const currentUsername = req.user?.username;

    if (!user1 || !user2) {
      return res.status(400).json({
        message: "user1 and user2 are required",
      });
    }

    if (currentUsername !== user1 && currentUsername !== user2) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: user1,
          receiver: user2,
        },
        {
          sender: user2,
          receiver: user1,
        },
      ],
    }).sort({
      createdAt: 1,
    });

    return res.json(messages);

  } catch (err) {

    return res.status(500).json({
      message: err.message,
    });

  }

}

async function deleteMessage(req, res) {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message.sender !== req.user?.username) {
      return res.status(403).json({
        message: "You can only delete your own message",
      });
    }

    await removeStoredFile(message.fileUrl);

    await Message.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Message Deleted",
    });

  } catch (err) {

    return res.status(500).json({
      message: err.message
    });

  }
}

module.exports = {
  getMessages,
  deleteMessage,
};