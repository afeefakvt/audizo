const mongoose = require('mongoose')

const googleSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    googleId:{
        type:String,
        unique:true,
        required:true
    }
})

module.exports = mongoose.model('googleUser',googleSchema)