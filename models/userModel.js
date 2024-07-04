const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
    },

    password:{
        type:String,
    },
    is_admin:{
        type:Number,
    },
    is_blocked: {
        type: Boolean,
        required: true,
        default: false
    },
    is_verified:{
        type: Boolean,
        default:false
    },
    is_googleAuthenticated:{
        type: Boolean,
        default:false
    }
});
module.exports=mongoose.model('User',userSchema);