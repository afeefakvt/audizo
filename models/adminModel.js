const { ObjectId } = require('mongodb');
const mongoose=require('mongoose');

const adminSchema=new mongoose.Schema({
    _id:{
        type:ObjectId,
        required:true

    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }


})
module.exports=mongoose.model('Admin',adminSchema);