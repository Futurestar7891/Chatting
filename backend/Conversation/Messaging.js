const express = require("express");
const route = express.Router();
const { validationResult } = require("express-validator");
const UserSchema = require("../Schema/Userschema");
const MessageSchema = require("../Schema/Messageschema");
const { conversationvalidation } = require("../Validatedata");

module.exports = (io) => {
  route.post("/send-receive", conversationvalidation, async (req, res) => {
    const { senderid, receiverid, message } = req.body;
    console.log("entered in backend");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }

    try {
      const sender = await UserSchema.findById(senderid);
      const receiver = await UserSchema.findById(receiverid);

      if (!sender || !receiver) {
        return res.status(404).json({
          success: false,
          message: "Sender or receiver does not exist",
        });
      }

      const newMessage = {
        senderId: { _id: sender._id }, // Ensure senderId is an object
        text: message.text || "",
        files: message.files || [],
        seen: false,
        timestamp: new Date(),
      };

      const conversation = await MessageSchema.sendMessage(
        io,
        sender._id,
        receiver._id,
        newMessage
      );

      return res.status(200).json({
        success: true,
        message: "Message sent successfully",
        messages: conversation ? conversation.messages : [],
      });
    } catch (error) {
      console.error("Error in /send-receive:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  });

  return route;
};
