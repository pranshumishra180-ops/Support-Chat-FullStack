const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },

    receiver: {
      type: String,
      required: true,
    },

    text: {
      type: String,
        default: "",
    },
  
    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Message",
  messageSchema
);