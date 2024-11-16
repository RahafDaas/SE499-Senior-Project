const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Reference to the Restaurant model
       
    },
    dishname: { type: String},
    offerPrice: { type: Number, required: true },
    offerDetails: { type: String }
   
});

module.exports = mongoose.model('Offer', offerSchema);
