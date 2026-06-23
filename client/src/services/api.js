import axios from "axios";

const api = axios.create({
  baseURL: "https://support-chat-fullstack.onrender.com",
  withCredentials: true,
});

export default api;