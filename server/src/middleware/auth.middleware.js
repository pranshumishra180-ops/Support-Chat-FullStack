const jwt = require("jsonwebtoken");
const { extractTokenFromRequest, verifyToken } = require("../utils/token");

function authMiddleware(req, res, next) {

  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = verifyToken(token);

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      message: "Invalid Token"
    });
  }
}

module.exports = authMiddleware;