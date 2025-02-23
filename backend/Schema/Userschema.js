const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness
  },
  Mobile: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness
  },
  Password: {
    type: String,
    required: true,
  },
  Photo: {
    type: String,
    default:
      "https://static-00.iconduck.com/assets.00/avatar-default-icon-988x1024-zsfboql5.png",
  },
  Bio: {
    type: String,
    default:
      "Hare Krishna Hare Krishna, Krishna Krishna Hare Hare Hare Rama Hare Rama Rama Rama Hare Hare",
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  ChatList: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User ID
        ref: "User",
        required: true,
      },
      lastMessageTime: {
        type: Date,
        default: Date.now, // Tracks the time of the most recent message
      },
    },
  ],
  Contacts: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User ID
        ref: "User",
        required: true,
      },
      contactname: {
        type: String, // Name given by the sender for this contact
        required: true,
      },
      contactmobile: {
        type: String, // Mobile number of the contact
      },
      contactemail: {
        type: String,
      },
    },
  ],
  // OTP fields
  otp: {
    type: String, // Storing as a string to avoid leading zero issues
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
});

// Add indexing to optimize queries
UserSchema.index({ Email: 1 }); // Ensures Email is unique
UserSchema.index({ Mobile: 1 }); // Optimizes Mobile lookups
UserSchema.index({ "ChatList.userId": 1 }); // Optimizes ChatList queries
UserSchema.index({ "Contacts.mobile": 1 }); // Optimizes Contacts mobile lookups

const User = mongoose.model("User", UserSchema);

module.exports = User;
