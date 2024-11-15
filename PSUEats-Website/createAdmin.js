// createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./UserSchema");

const MONGO_URI =
  "mongodb+srv://Rahaf2:Rahaftest1@cluster0.2j8u5.mongodb.net/UserDetails?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected...");
    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(1);
    }

    // Create a new admin account
    const hashedPassword = await bcrypt.hash("adminPassword123", 10); // Set a secure password here
    const admin = new User({
      name: "Admin",
      email: "adminManager@psu.edu.sa", // Admin email
      phoneNum: "1234567890",
      password: hashedPassword,
      role: "admin",
      isApproved: true,
    });

    await admin.save();
    console.log("Admin account created successfully!");
    process.exit(0);
  })
  .catch((err) => console.error("MongoDB connection error:", err));
