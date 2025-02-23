const express = require("express");
const router = express.Router();
const UserSchema = require("../Schema/Userschema"); // Adjust the path as needed
const twilio = require("twilio");
const nodemailer = require("nodemailer");
const { resetPasswordValidation } = require("../Validatedata");
const { hash } = require("bcryptjs");
const { validationResult } = require("express-validator");
require("dotenv").config(); // Load environment variables

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, // Your Twilio Account SID
  process.env.TWILIO_AUTH_TOKEN // Your Twilio Auth Token
);

// Function to send OTP via SMS
const sendSms = async (to, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}`, // SMS body
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: to, // Recipient phone number
    });
    console.log(`OTP sent to mobile: ${to}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send OTP via SMS.");
  }
};

// Create a transporter object using SMTP (for sending emails)
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.GMAIL, // Your email address
    pass: process.env.PASSWORD, // Your email password or app-specific password
  },
});

// Function to send OTP via email
const sendEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL, // Sender email address
    to: to, // Recipient email address
    subject: "Your OTP for Password Reset", // Email subject
    text: `Your OTP is: ${otp}`, // Plain text body
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`, // HTML body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to email: ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP via email.");
  }
};

// Send OTP Route
router.post("/send-otp", async (req, res) => {
  const { emailOrMobile } = req.body;

  if (!emailOrMobile) {
    return res
      .status(400)
      .json({ message: "Email or mobile number is required." });
  }

  try {
    // Find the user by email or mobile
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Save the OTP and its expiry time in the user's document
    user.otp = otp;
    user.otpExpiry = Date.now() + 300000; // OTP expires in 5 minutes
    await user.save();

    // Send OTP to email or mobile
    if (emailOrMobile.includes("@")) {
      await sendEmail(emailOrMobile, otp); // Send OTP to email
    } else {
      //   await sendSms(emailOrMobile, otp); // Send OTP to mobile
      return res.status(401).json({
        message: "Only Email service is available for forgot",
      });
    }

    return res.status(200).json({
      Otp: otp,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again." });
  }
});

// Validate OTP Route
router.post("/validate-otp", async (req, res) => {
  const { otp } = req.body;
  console.log(otp);

  try {
    // Find the user by OTP
    const user = await UserSchema.findOne({ otp: otp });
    // console.log(user);

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check if the OTP has expired
    if (user.otpExpiry < Date.now()) {
      user.otp = null;
      user.otpExpiry = null;
      return res.status(400).json({ message: "OTP has expired." });
    }
    await user.save();

    return res.status(200).json({ message: "OTP validated successfully." });
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res
      .status(500)
      .json({ message: "An error occurred. Please try again." });
  }
});

// Forgot Password Route
router.post("/reset-password", resetPasswordValidation, async (req, res) => {
  const { emailOrMobile, newPassword, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorobject = {};
    errors.array().forEach((object) => {
      errorobject[object.path] = object.msg;
    });
    console.log(errors);
    return res.status(400).json({ error: errorobject });
  }

  console.log(emailOrMobile, newPassword, confirmPassword);

  try {
    // Find the user using email or mobile
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      console.log("user not exist");
      return res
        .status(404)
        .json({ message: "User not found or OTP not validated." });
    }
    console.log("userexist");
    // console.log(user);
    // Ensure OTP was validated before allowing password reset

    if (user.otpExpiry + 300000 < Date.now()) {
      user.otp = null;
      user.otpExpiry = null;
      return res
        .status(400)
        .json({ message: "session for forgot password expired forgot again" });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      console.log("not matched");
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match." });
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the user's password and clear OTP fields
    user.Password = hashedPassword;
    user.otp = null; // Clear OTP field
    user.otpExpiry = null;
    await user.save();
    console.log("all things is set");
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while resetting the password." });
  }
});

module.exports = router;
