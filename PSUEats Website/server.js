const express = require("express");
const multer = require("multer");
const path = require("path");
const stripe = require("stripe")("YOUR_SECRET_KEY");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
const session = require("express-session");
const MongoStore = require("connect-mongo");
const data = require("./data");
// Set the view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the views directory

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "RAHAFsecretkey2024!!";

const User = require("./UserSchema"); // User schema
const ShopOwner = require("./ShopOwnerSchema"); // Shop Owner schema
const Restaurant = require("./RestaurantSchema"); // Restaurant schema
const Order = require("./OrderSchema"); // Import Order model
const { isAuthenticated, isAdmin } = require("./middleware"); // Admin, User middleware for protected routes

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
    if (existingUser) return res.status(400).send("User already exists.");

    // Password match check
    if (password !== password2)
      return res.status(400).send("Passwords do not match.");

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phoneNum,
      password: hashedPassword,
    });

    await newUser.save();
    // Create session after signup
    req.session.userId = newUser._id;
    req.session.role = newUser.role;

    res.sendFile(path.join(__dirname, "UserHomepage.html")); // Redirect to home page
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).send("Sign up failed. Please try again.");
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

    res.sendFile(path.join(__dirname, "UserHomepage.html"));
  } catch (err) {
    console.log("Error during login:", err);
    res.status(500).send("Login failed. Please try again.");
  }
});

// =======================================
// Shop Owner Signup Route
// =======================================
app.post("/shopowner-signup", async (req, res) => {
  const { name, phoneNum, password, password2, iqamaID } = req.body;

  try {
    // Check if the shop owner already exists
    const existingShopOwner = await ShopOwner.findOne({ phoneNum });
    if (existingShopOwner)
      return res.status(400).send("Shop owner already exists.");

    // Password match check
    if (password !== password2)
      return res.status(400).send("Passwords do not match.");

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newShopOwner = new ShopOwner({
      name,
      iqamaID,
      phoneNum,
      password: hashedPassword,
      role: "shopowner", // Ensure the role is set to shopowner
      approved: false, // Set approved to false initially
    });

    await newShopOwner.save();
    res.send(
      "Signup successful! Your request is pending approval and will be reviewed by the admin."
    ); // Send a message back
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
      req.session.name = shopOwner.name;
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
  const { email } = req.body;

  try {
    const shopOwner = await ShopOwner.findOne({ email });
    if (!shopOwner) return res.status(404).send("Shop owner not found.");

    shopOwner.isApproved = true;
    await shopOwner.save();

    res.send(`Shop owner ${email} approved successfully.`);
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

app.get("/user-signup-login", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "user-signup-login.html"));
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

/*// Route to insert data into MongoDB
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
  const { name, phoneNum } = req.body; // Extract data from the request body

  // Check if user is logged in (assuming you use sessions)
  if (!req.session.userId) {
    return res.status(401).send("User not logged in.");
  }

  try {
    // Update the user's profile in the database
    const updatedUser = await ShopOwner.findByIdAndUpdate(req.session.userId, {
      name,
      phoneNum,
    });
    // Redirect to the home page after successful update
    res.redirect("/"); // Adjust the path to your home page if needed
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

let ordersByOwner = {};

// Function to group and store orders by shop owner
function storeOrdersByOwner(groupedOrders) {
  for (const shopName in groupedOrders) {
    if (!ordersByOwner[shopName]) {
      ordersByOwner[shopName] = [];
    }
    ordersByOwner[shopName].push(...groupedOrders[shopName]);
  }
}

// Handle checkout
app.post("/checkout", isAuthenticated, async (req, res) => {
  try {
    const { orders, pickupTime, paymentMethod, totalPrice } = req.body;

    const userId = req.session.userId;

    // Retrieve the user by userId to get user details, including email
    const user = await User.findById(userId);
    // Create a new order with user email and other order details
    const order = new Order({
      orders,
      pickupTime,
      paymentMethod,
      totalPrice,
      email: user.email, // Access email from the retrieved user document
      paymentStatus: "Pending",
      orderStatus: "Pending",
      createdAt: new Date(),
    });

    // Save the order
    await order.save();

    // Add the new order ID to the user's orders array
    user.orders.push(order._id);
    await user.save();

    //res.json({ success: true, message: "Order successfully created." });
    if (paymentMethod === "pay on pick up") {
      return res.redirect(`/order-confirmation?id=${order._id}`);
    }
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ success: false, message: "Checkout failed", error });
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
    const { name } = req.session; // Extract the name from the session

    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).send("User not logged in.");
    }

    // Find the restaurant using the name from the session
    const restaurant = await Restaurant.findOne({ title: name }); // Use the name instead of "Selu Cafe"
    if (!restaurant) return res.status(404).send("Restaurant not found.");

    const foodItems = restaurant.food;

    // Fetch orders where the shop name matches the restaurant name
    const orders = await Order.find({
      "orders.shopName": name, // Match shopName in the orders with the restaurant name
    });
    //const offers=restaurant.offers;
    res.render("shopowner-dashboard", { foodItems, orders: orders, name });
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
      return res.status(404).send("Order not found.");
    }

    // Update the order status
    order.orderStatus = orderStatus;
    await order.save();

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

app.post(
  "/modify-food-item",
  isAuthenticated,
  upload.single("dishPic"),
  async (req, res) => {
    const { action, dishname, price, calories } = req.body;
    const newDishPic = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      if (action === "update") {
        // Update the food item, including the new image if uploaded
        await Restaurant.findOneAndUpdate(
          { "food.dishname": dishname },
          {
            $set: {
              "food.$.dishname": dishname,
              "food.$.price": price,
              "food.$.calories": calories,
              "food.$.dishPic": newDishPic, // Only update dishPic if a new image is provided
            },
          },
          { new: true }
        );
      } else if (action === "delete") {
        // Delete the food item
        await Restaurant.findOneAndUpdate(
          { "food.dishname": dishname },
          { $pull: { food: { dishname: dishname } } },
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
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body; // Amount should be in cents

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "sar", // Change to your preferred currency
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

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

// =======================================
// Start the Server
// =======================================
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
