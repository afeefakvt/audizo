const mongoose = require("mongoose")


const couponSchema = mongoose.Schema({
    couponCode:{
        type:String,
        required:true,
        unique:true
    },
 
    percentage:{
        type:Number,    
        required:true,
        
    },
    minPrice:{
        type:Number,
        required:true
    },
    maxRedeemAmount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true,
        index:{expires:0}
    },
},{timestamps:true})
module.exports = mongoose.model("Coupon",couponSchema)