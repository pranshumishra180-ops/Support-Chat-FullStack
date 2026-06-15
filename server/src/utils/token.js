const jwt = require("jsonwebtoken");

function parseCookieHeader(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.split("=");
    const key = rawKey?.trim();
    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(rawValue.join("=").trim());
    return cookies;
  }, {});
}

function extractTokenFromRequest(req) {
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

function extractTokenFromSocket(socket) {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  const cookies = parseCookieHeader(socket.handshake.headers.cookie || "");
  return cookies.token || null;
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  extractTokenFromRequest,
  extractTokenFromSocket,
  parseCookieHeader,
  verifyToken,
};