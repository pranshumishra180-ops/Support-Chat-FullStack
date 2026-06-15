function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return typeof username === "string" && /^[a-zA-Z0-9_.-]{3,24}$/.test(username);
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

function isValidMessageText(text) {
  return typeof text === "string" && text.length <= 4000;
}

module.exports = {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidMessageText,
};