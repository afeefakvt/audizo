const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")


const orderSchema = mongoose.Schema({
    orderId:{
        type:String,
        required:true,
    },
    userId:{
        type:ObjectId,
        required:true
    },
    totalPrice:{
        type:Number
    },
    items:[
        {
            productId:{
                type:ObjectId,
                require:true
            },
            productName:{
                type:String,
                required:true
            },
            categoryName:{
                type:String,
                required:true
            },
            image:{
                type:String
            },
            quantity:{
                type:Number,
                required:true
            },
            itemStatus:{
                type:String,
                required:true,
                default:"Ordered"
            },
            price:{
                type:Number,
                required:true
            },
            finalPrice:{
                type:Number
            },
            reason:{
                type:String
            },
            isApproved:{
                type:Boolean
            },
        }
    ],
    address:{
        name:{
            type:String,
            required:true
        },
        mobile:{
            type:Number,
        },
        pincode:{
            type:Number
        },
        house:{
            type:String
        },
        locality:{
            type:String
        },
        city:{
            type:String
        },
        state:{
            type:String 
        },
    },
    paymentMethod:{
        type:String,
        required:true,
    },
    paymentStatus:{
        type:String,
        
    },
    status:{
        type:String,
        required:true,
        default:"pending"
    },
    date:{
        type:Date,
        default: Date.now,
        required:true
    }
})

module.exports = mongoose.model("Order",orderSchema);