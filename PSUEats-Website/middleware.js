const User = require("./UserSchema");

const isAdmin = async (req, res, next) => {
  // Check if the session exists and the user role is admin
  if (req.session && req.session.role === "admin") {
    // Optionally: Verify admin user from the database if needed
    try {
      const user = await User.findById(req.session.userId);
      if (user && user.role === "admin") {
        return next(); // Continue if the user is an admin
      } else {
        return res.status(403).send("Access denied. Admins only.");
      }
    } catch (err) {
      console.error("Error verifying admin:", err);
      return res.status(500).send("Internal server error.");
    }
  } else {
    return res.status(403).send("Access denied. Admins only.");
  }
};

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    return res.redirect("/login?message=Please log in to access the homepage.");
  }
}

module.exports = { isAuthenticated, isAdmin };
