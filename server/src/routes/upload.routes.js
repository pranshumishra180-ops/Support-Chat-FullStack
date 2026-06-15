const { Router } = require("express");
const upload = require("../config/multer");
const authMiddleware = require("../middleware/auth.middleware");
const { uploadRateLimit } = require("../middleware/rateLimit.middleware");

console.log("UPLOAD ROUTE FILE LOADED");

const router = Router();

router.post(
  "/",
  authMiddleware,
  uploadRateLimit,
  upload.single("file"),
  (req, res) => {

    console.log("UPLOAD ROUTE HIT");

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const baseUrl = (
      process.env.SERVER_URL ||
      `${req.protocol}://${req.get("host")}`
    ).replace(/\/$/, "");

    return res.json({
      fileUrl: `${baseUrl}/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
    });

  }
);

module.exports = router;