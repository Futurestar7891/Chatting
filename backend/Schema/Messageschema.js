const mongoose = require("mongoose");
const UserSchema = require("./Userschema");
const MessageSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        default: "",
      },
      files: [
        {
          name: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
          },
          data: {
            type: String, // Base64 data
            required: true,
          },
        },
      ],
      seen: {
        type: Boolean,
        default: false,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

MessageSchema.statics.sendMessage = async function (
  io,
  senderId,
  receiverId,
  message
) {
  try {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    let conversation = await this.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!conversation) {
      conversation = new this({
        participants: [senderObjectId, receiverObjectId],
        messages: [message],
      });
    } else {
      conversation.messages.push(message);
    }

    await conversation.save();

    // Update ChatList for both sender and receiver
    const updateChatList = async (userId, otherUserId) => {
      const user = await UserSchema.findById(userId);
      if (user) {
        const chatEntry = user.ChatList.find((chat) =>
          chat.userId.equals(otherUserId)
        );
        if (chatEntry) {
          chatEntry.lastMessageTime = new Date();
        } else {
          user.ChatList.push({
            userId: otherUserId,
            lastMessageTime: new Date(),
          });
        }
        await user.save();
      }
    };

    await updateChatList(senderId, receiverId);
    await updateChatList(receiverId, senderId);

    const sortedIds = [
      senderObjectId.toString(),
      receiverObjectId.toString(),
    ].sort();
    const roomId = `${sortedIds[0]}-${sortedIds[1]}`;

    console.log(`Emitting message to room: ${roomId}`); // Debug log
    io.to(roomId).emit("receiveMessage", message);
    return conversation;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
