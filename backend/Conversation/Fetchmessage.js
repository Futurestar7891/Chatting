const express = require("express");
const route = express.Router();
const { validationResult } = require("express-validator");
const UserSchema = require("../Schema/Userschema");
const MessageSchema = require("../Schema/Messageschema");
const { conversationvalidation } = require("../Validatedata");
const mongoose = require("mongoose");

route.post("/fetch-messages", conversationvalidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  try {
    const { senderid, receiverid } = req.body;

    // Validate senderid and receiverid
    if (!mongoose.Types.ObjectId.isValid(senderid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID",
      });
    }

    // Check if sender and receiver exist
    const sender = await UserSchema.findById(senderid);
    const receiver = await UserSchema.findById(receiverid);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver does not exist",
      });
    }

    // Convert senderid and receiverid to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderid);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverid);

    // Find the conversation between the two participants
    const conversation = await MessageSchema.findOne({
      participants: {
        $all: [senderObjectId, receiverObjectId],
      },
    }).populate("messages.senderId", "username"); // Optionally populate sender details

    const userphoto = receiver.Photo;
    return res.status(200).json({
      success: true,
      messages: conversation ? conversation.messages : [],
      userphoto: userphoto,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = route;
