const {Router} = require('express');
const authControllers = require("../controllers/auth.controllers")
const authMiddleware = require("../middleware/auth.middleware");
const { authRateLimit } = require("../middleware/rateLimit.middleware");
const upload = require("../config/multer");


const router = Router();

router.post("/register", authRateLimit, authControllers.registerUser);
router.post("/login", authRateLimit, authControllers.loginUser);
router.post("/logout", authMiddleware, authControllers.logoutUser);
router.post("/avatar", authMiddleware, upload.single("file"), authControllers.updateAvatar);
router.get( "/profile",authMiddleware,async (req,res)=>{
		const user = await require("../models/user.model").findById(req.user.id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		return res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl || "",
			bio: user.bio || "",
			isOnline: Boolean(user.isOnline),
			lastSeen: user.lastSeen || null,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
});

router.get("/:username", authMiddleware, async (req, res) => {
	try {
		const username = typeof req.params.username === "string" ? req.params.username.trim() : "";

		if (!username) {
			return res.status(400).json({ message: "username is required" });
		}

		const user = await require("../models/user.model").findOne({ username }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl || "",
			bio: user.bio || "",
			isOnline: Boolean(user.isOnline),
			lastSeen: user.lastSeen || null,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

module.exports = router;