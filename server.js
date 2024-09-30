const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const collection = require("./UserSchema");
const app = express();
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  "mongodb+srv://Rahaf2:Rahaftest1@cluster0.2j8u5.mongodb.net/UserDetails?retryWrites=true&w=majority&appName=Cluster0";

const User = require("./UserSchema");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

app.post("/SignUp", async (req, res) => {
  // Extract data from the request body
  let name = req.body.name;
  let email = req.body.email;
  let phoneNum = req.body.phoneNum;
  let password = req.body.password;
  let password2 = req.body.password2;

  let user = new User({
    name: name,
    email: email,
    phoneNum: phoneNum,
    password: password,
    password2: password2,
  });

  //check if user already exists
  const existinUser = await collection.findOne({
    email,
    phoneNum,
  });
  if (existinUser) {
    res.send("User already exists. Please try another one");
  } else {
    //hash passwords using bcrypt
    const saltRecords = 10; //Number of salt round for bcrypt
    const hashedPassword = await bcrypt.hash(user.password, saltRecords);

    user.password = hashedPassword; //Replace the hashed password with original

    user
      .save()
      .then((result) => {
        console.log("Data saved...");
        res.sendFile(path.join(__dirname, "home.html"));
      })
      .catch((err) => console.log(err));
  }
});

app.post("/Login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await collection.findOne({ email });
    if (!user) {
      return res.send("User not found!");
    }

    // Compare the hashed password
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (isPasswordMatch) {
      res.sendFile(path.join(__dirname, "home.html"));
    } else {
      res.send("Wrong Password!");
    }
  } catch (err) {
    console.log("Error:", err);
    res.send("Login failed. Please try again.");
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname)));

// Sample API route //just for checking the functioning
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
