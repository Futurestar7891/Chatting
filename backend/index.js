const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectionDB = require("./Database/connnectDB");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: "500mb" }));

const io = new Server(server, {
  cors: {
    origin: "https://chit-chat-mocha.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🟢 New user connected: ${socket.id}`);

  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });
  socket.on("logout", () => {
    console.log("User logged out:", socket.id);
  });
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  socket.on("connect_error", (err) => {
    console.error("⚠️ Connection error:", err);
  });
});

// Import Routes
const signupandloginroute = require("./Forms/Signupandlogin");
const conversationroute = require("./Conversation/Messaging")(io);
const fetchedmessageroute = require("./Conversation/Fetchmessage");
const addcontactroute = require("./Contacts/Addcontacts");
const Fetchcontactroute = require("./Contacts/Fetchcontacts");
const ForgotUserroute = require("./Forms/ForgotUser");

// Use Routes
app.use("/", signupandloginroute);
app.use("/", conversationroute);
app.use("/", addcontactroute);
app.use("/", Fetchcontactroute);
app.use("/", fetchedmessageroute);
app.use("/", ForgotUserroute);

const PORT = process.env.PORT || 3000;
connectionDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`❌ Database connection failed: ${error}`);
  });
