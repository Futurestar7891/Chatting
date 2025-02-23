const express = require("express");
const { addcontactvalidation } = require("../Validatedata");
const { validationResult } = require("express-validator");
const Userschema = require("../Schema/Userschema");
const route = express.Router();

route.post("/add-contact", addcontactvalidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorobj = {};
    errors.array().forEach((obj) => {
      errorobj[obj.path] = obj.msg;
    });

    return res.status(400).json({
      success: false,
      error: errorobj,
    });
  }

  // Destructure the fields from the request body correctly
  const { contactemail, contactname, contactmobile, Username } = req.body;

  try {
    // Find the user who is adding the contact
    const userexist = await Userschema.findOne({ Mobile: Username });

    if (!userexist) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    // Find the user being added as a contact
    const contactUser = await Userschema.findOne({
      $or: [{ Email: contactemail }, { Mobile: contactmobile }],
    });

    if (!contactUser) {
      return res.status(400).json({
        success: false,
        message: "User is not registered on the chat app",
      });
    }

    // Prevent adding oneself as a contact
    if (contactUser._id.toString() === userexist._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contact",
      });
    }

    // Check if the contact already exists
    const isAlreadyAdded = userexist.Contacts.some(
      (contact) =>
        contact.userId.toString() === contactUser._id.toString() ||
        contact.contactname.toLowerCase() === contactname.toLowerCase()
    );

    if (isAlreadyAdded) {
      return res.status(400).json({
        success: false,
        message: "Contact already exists in your contact list",
      });
    }

    // Create the new contact object with userId
    const newcontact = {
      userId: contactUser._id, // Add the userId for the contact
      contactemail: contactemail || contactUser.Email,
      contactmobile: contactmobile || contactUser.Mobile,
      contactname: contactname,
    };

    // Push the new contact into the user's Contacts array
    userexist.Contacts.push(newcontact);

    // Save the updated user document
    await userexist.save();

    // Send a success response if the contact is saved successfully
    return res.status(200).json({
      success: true,
      message: "Contact added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding the contact",
    });
  }
});

module.exports = route;
