const {ObjectId} = require("mongodb")
const mongoose = require("mongoose");


const productOfferSchema = mongoose.Schema({
    productId:{
        type:ObjectId,
        ref:"Product"
    },
    offerPercentage:{
        type:Number
    },
    expiryDate:{
        type:Date,
        index:{expires:0}
    }
})
module.exports = mongoose.model("ProductOffer",productOfferSchema);