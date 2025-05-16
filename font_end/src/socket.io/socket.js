// src/socket.js
const { io } = require("socket.io-client");

export const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  withCredentials: true
});

