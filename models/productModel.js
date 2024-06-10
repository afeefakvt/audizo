const mongoose=require('mongoose')
const { ObjectId } = require("mongodb");

const Schema = mongoose.Schema;
const productSchema=new Schema({
    name:{
        type:String,
        required:true

    },
    categoryId: { 
        type: ObjectId,
         ref: "Category",
        required: true 
    },
    description:{
        type:String,
        required:true
    },
    images:{
        type:[String],
        required:true,
        default:[]
    },
    price:{
        type:Number,
        required:true
    },
    discountPrice:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    isListed:{
        type:Boolean,
        required:true,
        default:false
    },
    date: {
        type: Date,
        default: Date.now,
      }

})
module.exports=mongoose.model('Product',productSchema);