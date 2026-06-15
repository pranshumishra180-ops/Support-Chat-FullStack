const { Router } = require("express");

const { getMessages,  deleteMessage } = require("../controllers/message.controllers");
const authMiddleware = require("../middleware/auth.middleware");

const router = Router();

router.get("/", authMiddleware, getMessages);


router.delete("/:id", authMiddleware, deleteMessage);

module.exports = router;
