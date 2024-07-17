const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");


const cartSchema = mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:'User',
        required:true
        
    },
    items:[{
        productId:{
            type:ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true,
            default:1
        }

    }
     
    ]
})
module.exports= mongoose.model("Cart",cartSchema);