const express = require("express");
const Userschema = require("../Schema/Userschema");
const route = express.Router();

route.post("/search-chatlist", async (req, res) => {
  const { Username } = req.body;

  try {
    // Find the user making the request
    const userexist = await Userschema.findOne({ Mobile: Username })
      .populate("ChatList.userId")
      .populate("Contacts.userId");

    if (!userexist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // console.log("User Found:", userexist);

    // Fetch ChatList users sorted by lastMessageTime (latest first)
    let chatUsers = userexist.ChatList.filter((chat) => chat.userId) // Ensure userId exists
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)) // Sort by timestamp
      .map((chat) => {
        const contactEntry = userexist.Contacts.find(
          (contact) => contact.contactmobile === chat.userId.Mobile
        );

        return {
          _id: chat.userId._id,
          Name: contactEntry ? contactEntry.contactname : chat.userId.Name,
          Photo: chat.userId.Photo,
          Bio: chat.userId.Bio,
          Email: chat.userId.Email,
          Mobile: chat.userId.Mobile,
          lastMessageTime: chat.lastMessageTime,
        };
      });

    // console.log("Sorted ChatList Users:", chatUsers);

    return res.status(200).json({
      success: true,
      users: chatUsers,
    });
  } catch (error) {
    console.error("Error in /search-user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Route to search contacts if not in ChatList
route.post("/search-contact", async (req, res) => {
  const { Username, keyword } = req.body;

  try {
    const userexist = await Userschema.findOne({ Mobile: Username }).populate(
      "Contacts.userId"
    );

    if (!userexist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // console.log("User Found for Contact Search:", userexist);

    const contactUsers = userexist.Contacts.filter((contact) =>
      contact.contactname.toLowerCase().includes(keyword.toLowerCase())
    ).map((contact) => ({
      _id: contact.userId._id,
      Name: contact.contactname,
      Photo: contact.userId.Photo,
      Bio: chat.userId.Bio,
      Email: chat.userId.Email,
      Mobile: chat.userId.Mobile,
    }));

    // console.log("Filtered Contacts:", contactUsers);

    return res.status(200).json({
      success: true,
      contacts: contactUsers,
    });
  } catch (error) {
    console.error("Error in /search-contact:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = route;
