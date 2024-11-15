const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  email: { type: String },
  pickupTime: { type: String },
  paymentMethod: { type: String, default: "Pay on Pick Up" },
  totalPrice: { type: String },
  paymentStatus: { type: String, default: "Pending" },
  orderStatus: { type: String, default: "Pending" },
  orders: [
    {
      dishName: { type: String }, // Name of the dish
      price: { type: String }, // Price of the dish
      quantity: { type: Number }, // Quantity of the dish
      shopName: { type: String }, // Name of the shop (restaurant)
    },
  ],
  createdAt: { type: Date, default: Date.now },
  transactionId: { type: String }, // For online payments, store the transaction ID
});

module.exports = mongoose.model("Order", OrderSchema);
