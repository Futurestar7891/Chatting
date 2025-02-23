const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const {
  signupvalidation,
  loginvalidation,
  changePasswordValidation,
} = require("../Validatedata");
const UserSchema = require("../Schema/Userschema");
const { hash, compare } = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");

// POST route for user signup
router.post(
  "https://chit-chat-mocha.vercel.app/signup",
  signupvalidation,
  async (req, res) => {
    const errorobject = {};
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      return res.status(400).json({
        error: errorobject,
      });
    }

    // Extract data from the request body
    const { Name, Email, Mobile, Password, Photo } = req.body;

    if (!Name || !Email || !Mobile || !Password) {
      return res.status(400).json({
        message: "Field cannot be empty",
      });
    }

    // Check if user already exists
    const userexist = await UserSchema.findOne({
      $or: [{ Mobile: Mobile }, { Email: Email }],
    });

    if (userexist) {
      return res.status(400).json({
        message: "The User already exists",
      });
    }

    // Hash the password
    const hashpassword = await hash(Password, 10);

    try {
      // Create a new user
      const createuser = new UserSchema({
        Email: Email,
        Name: Name,
        Mobile: Mobile,
        Password: hashpassword,
        Photo:
          Photo ||
          "https://static-00.iconduck.com/assets.00/avatar-default-icon-988x1024-zsfboql5.png", // Use default if no photo is provided
      });

      // Save the user to the database
      await createuser.save();

      return res.status(200).json({
        message: "User is registered successfully",
      });
    } catch (error) {
      console.error("User not registered:", error);
      return res.status(500).json({
        message: "An error occurred while registering the user",
      });
    }
  }
);

router.post(
  "https://chit-chat-mocha.vercel.app/login",
  loginvalidation,
  async (req, res) => {
    const errors = validationResult(req);
    const { Email, Mobile, Password } = req.body;
    const errorobject = {}; // Define errorobject here

    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      return res.status(400).json({
        error: errorobject,
      });
    }

    try {
      const userexist = await UserSchema.findOne({
        $or: [{ Mobile: Mobile }, { Email: Email }],
      });

      if (userexist) {
        const passwordmatched = await compare(Password, userexist.Password);
        if (passwordmatched) {
          const token = jsonwebtoken.sign(
            { id: userexist._id, Mobile: userexist.Mobile },
            process.env.SECRET_KEY,
            { expiresIn: "1d" }
          );
          return res.status(200).json({
            message: "The user logged in successfully",
            Token: token,
            id: userexist._id,
            Mobile: userexist.Mobile,
            Photo: userexist.Photo,
            Bio: userexist.Bio,
            Name: userexist.Name,
            Email: userexist.Email,
          });
        } else {
          errorobject.Password = "The wrong password was entered";
          return res.status(400).json({
            error: errorobject,
          });
        }
      } else {
        if (Mobile) {
          errorobject.Mobile = "This user doesn't exist";
        } else {
          errorobject.Email = "The user doesn't exist";
        }
        return res.status(400).json({
          error: errorobject,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        message: "An error occurred during login",
      });
    }
  }
);

// Middleware to validate token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// Change Password Route
router.post(
  "https://chit-chat-mocha.vercel.app/change-password",
  authenticateToken,
  changePasswordValidation,
  async (req, res) => {
    const errors = validationResult(req);
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const errorobject = {};

    // Validate inputs
    if (!oldPassword) {
      errorobject.oldPassword = "Old Password is required";
    }
    if (!newPassword) {
      errorobject.newPassword = "New Password is required";
    }
    if (!confirmPassword) {
      errorobject.confirmPassword = "Confirm Password is required";
    }
    if (newPassword !== confirmPassword) {
      errorobject.confirmPassword = "Passwords do not match";
    }

    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      return res.status(400).json({
        error: errorobject,
      });
    }

    try {
      // Find the user by ID from the token
      const user = await UserSchema.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Verify old password
      const isPasswordValid = await compare(oldPassword, user.Password);
      if (!isPasswordValid) {
        errorobject.oldPassword = "Incorrect old password";
        return res.status(400).json({ error: errorobject });
      }

      if (newPassword === oldPassword) {
        errorobject.newPassword = "Password Cannot be Same as Old";
        return res.status(400).json({ error: errorobject });
      }

      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);

      // Update the user's password
      user.Password = hashedPassword;
      await user.save();

      return res
        .status(200)
        .json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Change Password Error:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while changing the password." });
    }
  }
);

router.post("https://chit-chat-mocha.vercel.app/logout", (req, res) => {
  // Clear the cookie
  res.clearCookie("token");
  // Optionally, handle token invalidation logic here (e.g., add to blacklist)
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
