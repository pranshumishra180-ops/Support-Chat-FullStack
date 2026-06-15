const express = require('express');
const cors = require('cors')
const cookieParser = require("cookie-parser");
const path = require("path");
const messageRoutes = require("./routes/message.routes");
const uploadRoutes = require("./routes/upload.routes");


const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth',authRoutes);
app.use('/api/messages', messageRoutes);
app.use("/api/upload",uploadRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads.js")));


module.exports = app;