const mongoose = require("mongoose");
const {ObjectId}  = require("mongodb");

const addressSchema = mongoose.Schema({
    userId:{
        type:ObjectId
    },
    address:[
        {
            name:{
                type:String,
                required:true
            },
            mobile:{
                type:String
            },
            pincode:{
                type:String
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
    ],

});
module.exports = mongoose.model("Address",addressSchema);