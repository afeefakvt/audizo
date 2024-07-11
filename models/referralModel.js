const mongoose  =require("mongoose")
const {ObjectId} = require("mongodb")


const referralSchema = mongooose.Schema({
    userId:{
        type:ObjectId,
        ref:"User"

    },
    referralId:{
        type:String
    }
})
module.exports = mongoose.model("Referral",referralSchema)