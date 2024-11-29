const express = require("express");
const multer = require("multer");
const path = require("path");
//const stripe = require("stripe")(process.env.STRIPE_SECRET_key);
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
const session = require("express-session");
const MongoStore = require("connect-mongo");
const data = require("./data");

// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});
const upload = multer({ storage: storage });

// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the views directory

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "RAHAFsecretkey2024!!";

const User = require("./UserSchema"); // User schema
const ShopOwner = require("./ShopOwnerSchema"); // Shop Owner schema
const Restaurant = require("./RestaurantSchema"); // Restaurant schema
const Order = require("./OrderSchema"); // Import Order model
const Review = require("./ReviewSchema");
const { isAuthenticated, isAdmin } = require("./middleware"); // Admin, User middleware for protected routes
const { title } = require("process");

const MONGO_URI =
  "mongodb+srv://Rahaf2:Rahaftest1@cluster0.2j8u5.mongodb.net/UserDetails?retryWrites=true&w=majority&appName=Cluster0";

// Middleware
app.use(express.static(path.join(__dirname))); // Serve static files
app.use(express.urlencoded({ extended: false })); // Parse form data
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

// =======================================
// SESSION SETUP
// =======================================
app.use(
  session({
    secret: SESSION_SECRET, // Set a strong secret key for session
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
      secure: process.env.NODE_ENV === "production", // Set to true in production
      httpOnly: true, // Prevent client-side JS from accessing the cookies
      sameSite: "strict", // Prevent CSRF
    },
  })
);
/*
// Handle unknown routes
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found - PSUEats",
    errorCode: 404,
    errorMessage: "The page you are looking for does not exist.",
  });
});*/

//About us
app.get("/AboutUs", async (req, res) => {
  try {
    res.render("AboutUs", {
      heading: "Making Campus Life Tastier and Easier",
      description:
        "At PSUEats, we understand how busy life can be. Whether your are rushing between classes, or need a quick bite during your study session, our platform is designed to simplify your food experience. We bring all your favorite campus resturents and coffee shops together in one place, allowing you to pre-order meals, avoid long queues, and enjoy more time with friends.",
    }); // Use a template engine like EJS
  } catch (err) {
    console.error("Error fetching about us page:", err);
    res.status(500).send("Failed to retrieve about us page.");
  }
});

// =======================================
// User Signup Route
// =======================================
app.post("/user-signup", async (req, res) => {
  const { name, email, phoneNum, password, password2 } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.json({ success: false, message: "User already exists." });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Check if hashedPassword is correctly generated
    if (!hashedPassword) {
      return res.status(500).send("Error hashing password.");
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      phoneNum,
      password: hashedPassword,
      psueatsPoints: 100,
    });

    // Save the user to the database
    await newUser.save();
    return res.json({
      success: true,
      message: "Registration successful. Please log in.",
    });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.json({
      success: false,
      message: "Sign up failed. Please try again.",
    });
  }
});

// =======================================
// User Login Route
// =======================================

app.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found!");

    if (user.role === "shopowner" && !user.approved) {
      return res.status(403).send("Shop owner account not approved by admin.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).send("Wrong Password!");

    // Create session after login
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.psueatsPoints = user.psueatsPoints;

    res.sendFile(path.join(__dirname, "UserHomepage.html"));
  } catch (err) {
    console.log("Error during login:", err);
    res.status(500).send("Login failed. Please try again.");
  }
});

// =======================================
// Shop Owner Signup Route
// =======================================
app.post("/shopowner-signup", upload.single("iqamaID"), async (req, res) => {
  // Log to check if the file is uploaded
  console.log("Uploaded file:", req.file);
  console.log("Request Body:", req.body);

  if (!req.file) {
    return res.status(400).send("No IQAMA image uploaded.");
  }

  const { name, ShopName, phoneNum, password, password2 } = req.body;
  const iqamaID = req.file.path; // Path to the uploaded image

  try {
    // Check if the shop owner already exists
    const existingShopOwner = await ShopOwner.findOne(
      { phoneNum },
      { ShopName }
    );
    if (existingShopOwner) {
      return res.status(400).send("Shop owner already exists.");
    }

    // Check if passwords match
    if (password !== password2) {
      return res.status(400).send("Passwords do not match.");
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new shop owner
    const newShopOwner = new ShopOwner({
      name,
      ShopName,
      phoneNum,
      password: hashedPassword,
      iqamaID, // Path to the uploaded IQAMA image
      role: "shopowner", // Set role to shopowner
      approved: false, // Default approval status
    });

    await newShopOwner.save();

    res.send(
      "Signup successful! Your request is pending approval and will be reviewed by the admin."
    );
  } catch (err) {
    console.error("Error during shop owner signup:", err);
    res.status(500).send("Shop owner signup failed. Please try again.");
  }
});

// =======================================
// Shop Owner Login Route
// =======================================
app.post("/shopowner-login", async (req, res) => {
  const { phoneNum, password } = req.body;

  try {
    const shopOwner = await ShopOwner.findOne({ phoneNum, role: "shopowner" });
    if (!shopOwner) return res.status(404).send("Shop owner not found.");

    const isPasswordMatch = await bcrypt.compare(password, shopOwner.password);
    if (!isPasswordMatch) return res.status(401).send("Incorrect password.");

    if (shopOwner.isApproved === false) {
      return res.status(403).send("Account pending approval.");
    } else {
      // Create session after login
      req.session.userId = shopOwner._id;
      req.session.role = shopOwner.role;
      req.session.ShopName = shopOwner.ShopName;
      res.redirect("/dashboard"); // Redirect to shop owner dashboard
    }
  } catch (err) {
    console.error("Error during Shop Owner Login:", err);
    res.status(500).send("Login failed. Please try again.");
  }
});

// =======================================
// Admin Login Route
// =======================================
app.post("/adminLogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).send("Admin account not found.");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).send("Invalid admin password.");

    // Create session after login
    req.session.userId = admin._id;
    req.session.role = "admin";

    res.sendFile(path.join(__dirname, "admin-dashboard.html")); // Redirect to admin dashboard
  } catch (err) {
    console.error("Error during admin login:", err);
    res.status(500).send("Admin login failed. Please try again.");
  }
});

// =======================================
// Admin-Protected Routes
// =======================================
app.get("/pendingShopOwners", isAdmin, async (req, res) => {
  try {
    const pendingShopOwners = await ShopOwner.find({ isApproved: false });
    res.json(pendingShopOwners);
  } catch (err) {
    console.error("Error fetching pending shop owners:", err);
    res.status(500).send("Failed to retrieve pending shop owners.");
  }
});

app.post("/approveShopOwner", isAdmin, async (req, res) => {
  const { phoneNum } = req.body;

  try {
    const shopOwner = await ShopOwner.findOne({ phoneNum });
    if (!shopOwner) return res.status(404).send("Shop owner not found.");

    shopOwner.isApproved = true;
    await shopOwner.save();

    res.send(`Shop owner ${shopOwner.ShopName} approved successfully.`);
  } catch (err) {
    console.error("Error approving shop owner:", err);
    res.status(500).send("Failed to approve shop owner.");
  }
});

// =======================================
// Define routes for serving HTML pages
// =======================================
app.get("/adminLogin", (req, res) => {
  res.sendFile(path.join(__dirname, "adminLogin.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/", (req, res) => {
  res.redirect("/register");
});
// Route for login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/shopowner-signup", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "shopowner-signup.html"));
});

app.get("/shopowner-login", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "shopownerLogin.html"));
});

app.get("/home", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "UserHomepage.html")); // Serve home page if authenticated
});

// Endpoint to log out the user
app.get("/Logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Failed to log out.");
    }
    res.redirect("/"); // Redirect to login page after logout
  });
});

app.use(express.urlencoded({ extended: true }));

// Endpoint to Get All Shop Owners
app.get("/getShopOwners", async (req, res) => {
  try {
    const shopOwners = await ShopOwner.find();
    res.status(200).json(shopOwners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shop owners" });
  }
});

//display all users in admin homepage
app.get("/get-users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users); // Send the users as a JSON response
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

//delete users in admin homepage
app.delete("/delete-user/:id", async (req, res) => {
  const { id } = req.params; // Extract user ID from the request parameters

  try {
    const user = await User.findByIdAndDelete(id); // Delete user from DB
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

// Approve Shop Owner
app.post("/approveShopOwner/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedShopOwner = await ShopOwner.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    if (!updatedShopOwner)
      return res.status(404).json({ message: "Shop Owner not found" });
    res.status(200).json({
      message: "Shop Owner approved successfully",
      shopOwner: updatedShopOwner,
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving shop owner" });
  }
});

// Reject Shop Owner
app.delete("/rejectShopOwner/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedShopOwner = await ShopOwner.findByIdAndDelete(id);
    if (!deletedShopOwner)
      return res.status(404).json({ message: "Shop Owner not found" });
    res
      .status(200)
      .json({ message: "Shop Owner rejected and deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting shop owner" });
  }
});

// Update points route at admin dashboard
app.put("/update-points/:userId", async (req, res) => {
  const { userId } = req.params;
  const { psueatsPoints } = req.body;

  try {
    // Find the user and update the points
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update the points
    user.psueatsPoints = psueatsPoints;
    await user.save();

    res.json({ success: true, message: "Points updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating points" });
  }
});

/*// An Old Route to insert data into MongoDB
app.get("/insert-restaurants", async (req, res) => {
  try {
    // Ensure this code is not called multiple times without checking if data already exists
    const existingRestaurants = await Restaurant.find();
    if (existingRestaurants.length > 0) {
      return res.send("Restaurants already exist.");
    }

    await Restaurant.insertMany(data); // Insert all restaurants at once
    res.send("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Failed to insert data.");
  }
});*/

//shop owner profile
app.get("/ownerProfile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("owner not logged in.");
  }

  ShopOwner.findById(req.session.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found.");
      }
      res.render("ownerProfile", { user }); // Use a template engine like EJS
    })
    .catch((err) => {
      console.error("Error fetching user profile:", err);
      res.status(500).send("Failed to retrieve profile.");
    });
});

//owner update profile
app.post("/update-profile", isAuthenticated, async (req, res) => {
  const { ShopName, phoneNum } = req.body; // Extract data from the request body

  // Check if user is logged in (assuming you use sessions)
  if (!req.session.userId) {
    return res.status(401).send("User not logged in.");
  }

  try {
    // Update the user's profile in the database
    const updatedUser = await ShopOwner.findByIdAndUpdate(req.session.userId, {
      ShopName,
      phoneNum,
    });
    // Redirect to the home page after successful update
    res.redirect("/dashboard"); // Adjust the path to your home page if needed
    if (!updatedUser) {
      return res.status(404).send("User not found.");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Failed to update profile.");
  }
});

// User profile
app.get("/userProfile", isAuthenticated, (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("user not logged in.");
  }

  User.findById(req.session.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found.");
      }
      res.render("userProfile", { user }); // Use a template engine like EJS
    })
    .catch((err) => {
      console.error("Error fetching user profile:", err);
      res.status(500).send("Failed to retrieve profile.");
    });
});

//user update profile
app.post("/updateUser-profile", isAuthenticated, async (req, res) => {
  const { name, phoneNum, email } = req.body; // Extract data from the request body

  // Check if user is logged in (assuming you use sessions)
  if (!req.session.userId) {
    return res.status(401).send("User not logged in.");
  }

  try {
    // Update the user's profile in the database
    const updatedUser = await User.findByIdAndUpdate(req.session.userId, {
      name,
      phoneNum,
      email,
    });
    // Redirect to the home page after successful update
    res.redirect("/UserHomepage.html"); // Adjust the path to your home page if needed
    if (!updatedUser) {
      return res.status(404).send("User not found.");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Failed to update profile.");
  }
});

// Endpoint to get all restaurants
app.get("/get-restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find(); // Fetch all restaurants
    res.status(200).json(restaurants); // Return them as JSON
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).send("Failed to retrieve restaurants.");
  }
});

app.get("/get-menu-items", async (req, res) => {
  try {
    const { restaurant } = req.query; // Get restaurant name from query params
    const restaurantData = await Restaurant.findOne({ title: restaurant }); // Fetch restaurant details
    res.status(200).json(restaurantData.food); // Return the food items
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).send("Failed to retrieve menu items.");
  }
});

app.post("/add-restaurant", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const {
      title,
      time,
      pickup,
      isOpen,
      logoUrl,
      rating,
      ratingCount,
      code,
      location,
      category,
    } = req.body;

    if (!title) {
      throw new Error("Restaurant title is required.");
    }

    const newRestaurant = new Restaurant({
      title,
      time,
      pickup,
      isOpen,
      logoUrl,
      rating,
      ratingCount,
      code,
      location,
      category,
    });

    await newRestaurant.save();

    res.json({
      success: true,
      message: "Restaurant added successfully.",
      data: newRestaurant,
    });
  } catch (error) {
    console.error("Error in /add-restaurant:", error.message);
    res.status(500).json({
      success: false,
      message: "Error adding restaurant.",
      error: error.message,
    });
  }
});

app.get("/order-history", async (req, res) => {
  try {
    if (!req.session.email) {
      return res.redirect("/"); // Redirect to login if not logged in
    }

    // Fetch orders based on the user's email
    const orders = await Order.find({ email: req.session.email }).sort({
      createdAt: -1,
    });

    // Render order history page with the user's orders
    res.render("order-history", { orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server error");
  }
});

app.delete("/order/delete/:orderId", (req, res) => {
  const { orderId } = req.params;
  Order.findByIdAndDelete(orderId)
    .then((result) => {
      if (!result) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      return res.status(200).json({ success: true });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete order" });
    });
});

// Handle checkout
app.post("/checkout", async (req, res) => {
  try {
    const { orders, pickupTime, paymentMethod, totalPrice } = req.body;
    const user = await User.findById(req.session.userId);

    const order = new Order({
      orders,
      pickupTime,
      paymentMethod,
      totalPrice,
      email: user.email,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      createdAt: new Date(),
    });

    await order.save();
    user.orders.push(order._id);
    await user.save();

    if (paymentMethod === "pay on pick up") {
      return res.redirect(`/order-confirmation?id=${order._id}`);
    }
    if (paymentMethod === "psueats points") {
      const totalPriceNum = parseFloat(totalPrice);
      if (user.psueatsPoints < totalPriceNum) {
        return res.status(400).json({ error: "Insufficient Points." });
      }
      user.psueatsPoints -= totalPriceNum;
      order.paymentStatus = "Paid";
      await user.save();
      return res.redirect(`/order-confirmation?id=${order._id}`);
    }
    if (paymentMethod === "online") {
      order.paymentStatus = "Paid";
      await order.save();
      return res.redirect(`/order-confirmation?id=${order._id}`);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "An error occurred during checkout." });
  }
});

app.get("/order-confirmation", async (req, res) => {
  const { id } = req.query; // Retrieve orderId from query parameter

  try {
    // Find the order by ID
    const order = await Order.findById(id).populate("orders.dishName"); // Populate dishName or any other details needed

    // Check if order exists
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Render the order confirmation page and pass the entire order details
    return res.render("order-confirmation", {
      order: order, // Pass the entire order object
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error retrieving order details");
  }
});

// Route to render order confirmation page with dynamic data
app.get("/order-confirmation/:id", isAuthenticated, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Fetch the order from the database using the order ID
    const order = await Order.findById(orderId).populate("orders.dishName"); // Replace with your model if needed

    if (order) {
      // Pass the order data to the EJS template
      return res.render("order-confirmation", { order });
    } else {
      return res.status(404).send("Order not found.");
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).send("Error fetching order.");
  }
});

// Route to render the dashboard with food items for the logged-in shop owner
app.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const { ShopName } = req.session; // Extract the name from the session
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).send("User not logged in.");
    }

    // Find the restaurant using the name from the session
    const restaurant = await Restaurant.findOne({ title: ShopName }); // Use the name instead of "Selu Cafe"
    if (!restaurant) return res.status(404).send("Restaurant not found.");

    const foodItems = restaurant.food;

    // Fetch orders where the shop name matches the restaurant name
    const orders = await Order.find({
      "orders.shopName": ShopName, // Match shopName in the orders with the restaurant name
    });
    //const offers=restaurant.offers;
    res.render("shopowner-dashboard", { foodItems, orders: orders, ShopName });
  } catch (error) {
    console.error("Error fetching restaurant and orders data:", error);
    res.status(500).send("An error occurred.");
  }
});

app.post("/update-order-status", isAuthenticated, async (req, res) => {
  try {
    const { orderId, orderStatus } = req.body; // Get the order ID and new status from the form submission

    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("Order not found");
      return res.status(404).send("Order not found.");
    }

    // Update the order status
    order.orderStatus = orderStatus;

    // Check if orderStatus should trigger paymentStatus change to 'Paid'
    if (["Confirmed", "Processing", "Picked Up"].includes(orderStatus)) {
      order.paymentStatus = "Paid";
    } else {
      console.log(
        "paymentStatus not updated since orderStatus is not in the specified list"
      );
    }

    // Save the changes
    await order.save();
    console.log("Order saved successfully");

    // Redirect back to the dashboard after updating the status
    res.redirect("/dashboard"); // You can also send a message or update with a success message
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("An error occurred while updating the order status.");
  }
});

app.post("/delete-order", isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.body; // Get the orderId from the form submission

    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found.");
    }

    // Delete the order from the database
    await Order.findByIdAndDelete(orderId);

    // Redirect back to the dashboard after deleting the order
    res.redirect("/dashboard"); // Redirect to the dashboard or any other page
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).send("An error occurred while deleting the order.");
  }
});

app.post(
  "/modify-food-item",
  isAuthenticated,
  upload.single("dishPic"),
  async (req, res) => {
    const { action, originalDishname, dishname, price, calories } = req.body;
    const newDishPic = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      if (action === "update") {
        // Update the food item, including the new image if uploaded
        const updateFields = {
          "food.$.price": price,
          "food.$.calories": calories,
        };
        if (dishname) updateFields["food.$.dishname"] = dishname;
        if (newDishPic) updateFields["food.$.dishPic"] = newDishPic;

        await Restaurant.findOneAndUpdate(
          { "food.dishname": originalDishname },
          { $set: updateFields },
          { new: true }
        );
      } else if (action === "delete") {
        // Delete the food item
        await Restaurant.findOneAndUpdate(
          { "food.dishname": originalDishname },
          { $pull: { food: { dishname: originalDishname } } },
          { new: true }
        );
      }
      res.redirect("/dashboard"); // Redirect or respond with success
    } catch (error) {
      console.error("Error updating food item:", error);
      res.status(500).send("An error occurred while updating the food item.");
    }
  }
);

// =======================================
// Stripe
// =======================================

// Route to update order status
app.post("/update-status/:id", isAuthenticated, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body; // The new status comes from the form submission

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (updatedOrder) {
      // After status update, redirect to the same order confirmation page
      return res.redirect(`/order-confirmation/${updatedOrder._id}`);
    } else {
      return res.status(404).send("Order not found.");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).send("Error updating order status.");
  }
});

app.get("/user-info", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ psueatsPoints: user.psueatsPoints });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to add a food item to a restaurant
app.post("/add-food-item/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;
  const { dishname, dishPic, price, calories, ownerId } = req.body;

  if (!dishname || !price || !ownerId) {
    return res.status(400).send("Dish name, price, and owner ID are required.");
  }

  try {
    // Find the restaurant by ID and ownerId to ensure the owner can only modify their restaurant
    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });

    if (!restaurant) {
      return res
        .status(404)
        .send(
          "Restaurant not found or you do not have permission to add items."
        );
    }

    // Create the food item
    const newFoodItem = {
      dishname,
      dishPic,
      price,
      calories,
    };

    // Push the new food item to the food array
    restaurant.food.push(newFoodItem);
    await restaurant.save();

    res.status(201).send("Food item added successfully!");
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).send("Failed to add food item.");
  }
});

app.get("/owner/restaurants", async (req, res) => {
  const shopOwnerName = req.query.name; // Assuming you are passing the owner's name as a query parameter
  if (!shopOwnerName) {
    return res.status(400).json({ message: "Shop owner name is required." });
  }

  try {
    // Find the shop owner
    const shopOwner = await ShopOwner.findOne({ name: shopOwnerName });
    if (!shopOwner) {
      return res.status(404).json({ message: "Shop owner not found." });
    }

    // Fetch restaurants associated with this shop owner
    const restaurants = await Restaurant.find({ ownerId: shopOwner._id }); // Use ownerId from ShopOwner

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/restaurants/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const restaurants = await Restaurant.find({ name }).populate("name");
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants", error });
  }
});

//get Menu Managment Page
app.get("/menuMgmnt", async (req, res) => {
  try {
    // Step 1: Find the ShopOwner by the logged-in session
    const owner = await ShopOwner.findById(req.session.userId);
    if (!owner) {
      return res.status(404).send("Shop owner not found.");
    }

    // Step 2: Find the restaurant that matches the shop owner's name
    const restaurant = await Restaurant.findOne({
      title: { $regex: `^${owner.ShopName.trim()}$`, $options: "i" },
    }).populate("food"); // Populate the 'food' array to get the menu items

    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    // Step 3: Send the restaurant data and its menu items to the view
    res.render("menuMgmnt", { restaurant, items: restaurant.food });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving the restaurant.");
  }
});

// =======================================
// New Item Adding
// =======================================
app.post("/menuMgmnt", async (req, res) => {
  const { dishname, dishPic, price, calories } = req.body;

  try {
    // Step 1: Find the shop owner by the logged-in session
    const owner = await ShopOwner.findById(req.session.userId);
    if (!owner) {
      return res.status(404).send("Shop owner not found.");
    }

    // Step 2: Find the restaurant by its title (matching the shop owner's name)
    const restaurant = await Restaurant.findOne({
      title: { $regex: `^${owner.ShopName.trim()}$`, $options: "i" },
    });

    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    // Step 3: Create the new menu item (dish)
    const newItem = {
      dishname,
      dishPic,
      price,
      calories,
    };

    // Step 4: Add the new item to the restaurant's food array
    restaurant.food.push(newItem);

    // Step 5: Save the updated restaurant document
    await restaurant.save();

    console.log(newItem); // Log the new item

    // Step 6: Reload the restaurant data and render the menu management page
    res.render("menuMgmnt", { restaurant, items: restaurant.food });
  } catch (err) {
    console.error("Error during adding item:", err);
    res.status(500).send("Adding item failed. Please try again.");
  }
});

// open the adding item form:
app.get("/addingItem", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("owner not logged in.");
  }

  ShopOwner.findById(req.session.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found.");
      }
      res.render("addingItem", { user }); // Use a template engine like EJS
    })
    .catch((err) => {
      console.error("Error fetching shop menu", err);
      res.status(500).send("Failed to retrieve shop menu.");
    });
});

app.post("/addingItem", upload.single("dishPic"), async (req, res) => {
  const { dishname, price, calories, isActive, newPrice, description } =
    req.body;
  const dishPic = req.file.path; // Path to the uploaded image

  try {
    // Step 1: Find the ShopOwner by the logged-in session
    const owner = await ShopOwner.findById(req.session.userId);
    if (!owner) {
      return res.status(404).send("Shop owner not found.");
    }

    // Step 2: Find the restaurant whose title matches the shop owner's name
    const restaurant = await Restaurant.findOne({
      title: { $regex: `^${owner.ShopName.trim()}$`, $options: "i" },
    });

    // If no restaurant is found, return an error
    if (!restaurant) {
      return res
        .status(404)
        .send("Restaurant not found with the given shop owner name.");
    }

    // Step 3: Check if the `ownerId` is set correctly in the restaurant document
    if (!restaurant.ownerId) {
      restaurant.ownerId = owner._id; // Set the `ownerId` field if it's missing
    }

    // Step 4: Prepare the offer object
    let offer = {};
    if (isActive === "true") {
      if (!newPrice || !description) {
        return res
          .status(400)
          .send("Offer is active, but newPrice and description are required.");
      }

      offer = {
        isActive: true,
        newPrice: Number(newPrice), // Make sure it's a number
        description,
      };
    } else {
      offer = {
        isActive: false,
      };
    }

    // Step 5: Create the new food item
    const newItem = {
      dishname,
      dishPic, // Save the path to the uploaded image
      price,
      calories,
      offer, // Include the offer object
    };

    // Step 6: Add the new food item to the food array of the restaurant
    restaurant.food.push(newItem);

    // Step 7: Save the updated restaurant document
    await restaurant.save();

    // Step 8: Redirect to the menu management page (or render a success message)
    res.redirect("/menuMgmnt");
  } catch (err) {
    console.error("Error during adding item:", err);
    res.status(500).send("Failed to add item. Please try again.");
  }
});

app.get("/get-menu", async (req, res) => {
  const restaurantCode = req.query.restaurantCode;
  const menu = await fetchMenuFromDatabase(restaurantCode); // Replace with your DB logic
  res.json(menu);
});

//Offers
app.get("/Offers", async (req, res) => {
  try {
    // Step 1: Find the ShopOwner by the logged-in session
    const owner = await ShopOwner.findById(req.session.userId);
    if (!owner) {
      return res.status(404).send("Shop owner not found.");
    }

    // Step 2: Find the restaurant that matches the shop owner's name
    const restaurant = await Restaurant.findOne({
      title: { $regex: `^${owner.ShopName.trim()}$`, $options: "i" },
    }).populate("food"); // Populate the 'food' array to get the menu items

    if (!restaurant) {
      return res.status(404).send("Restaurant not found.");
    }

    // Step 3: Send the menu items to the view
    res.render("Offers", { restaurant, items: restaurant.food });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while retrieving the restaurant.");
  }
});

// Route to update an existing offer
app.post("/addOffer", async (req, res) => {
  const { newPrice, offerDetails } = req.body;

  try {
    // Step 1: Find the ShopOwner by the logged-in session
    const owner = await ShopOwner.findById(req.session.userId);
    if (!owner) {
      return res.status(404).send("Shop owner not found.");
    }

    // Step 2: Find the restaurant whose title matches the shop owner's name
    const restaurant = await Restaurant.findOne({
      title: { $regex: `^${owner.ShopName.trim()}$`, $options: "i" },
    });

    if (!restaurant) {
      return res
        .status(404)
        .send("Restaurant not found with the given shop owner name.");
    }

    // Step 3: Find the food item by its dishname (instead of _id)
    const foodItem = restaurant.food.find(
      (item) => item.dishname === req.body.dishname
    );

    if (!foodItem) {
      return res.status(404).send("Food item not found.");
    }

    // Step 4: Update the offer
    if (isActive === "true") {
      if (!newPrice || !offerDetails) {
        return res
          .status(400)
          .send("Offer is active, but newPrice and offerDetails are required.");
      }

      foodItem.offer = {
        isActive: true,
        newPrice: Number(newPrice),
        offerDetails,
      };
    } else {
      foodItem.offer = {
        isActive: false,
      };
    }

    // Step 5: Save the updated restaurant document
    await restaurant.save();

    // Step 6: Respond with success or redirect
    res.redirect("/menuMgmnt");
  } catch (err) {
    console.error("Error updating offer:", err);
    res.status(500).send("Failed to update offer. Please try again.");
  }
});

app.post("/submitReview", async (req, res) => {
  try {
    const { ratingFood, ratingService, feedback, selectedShop } = req.body;

    const newReview = new Review({
      ratingFood,
      ratingService,
      feedback,
      selectedShop,
    });

    await newReview.save();
    res.status(200).send({ message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).send({ error: "Failed to submit review." });
  }
});

app.get("/get-all-reviews", async (req, res) => {
  try {
    const reviews = await Review.find(); // Assuming you have a `ReviewModel`
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send("Error fetching reviews");
  }
});

// =======================================
// Start the Server
// =======================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
