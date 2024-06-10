const mongoose= require('mongoose');


const otp=mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        expires:60,
        default:Date.now,
    },

})
otp.index({createdAt:1},{expireAfterSeconds:60});

module.exports=mongoose.model("Otp",otp);