const Coupon = require("../models/couponModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");

const loadAddCoupon = async(req,res)=>{
    try {
        let coupon  =await Coupon.find();
        res.render("coupon",{coupon:coupon});
    } catch (error) {
        console.log(error.message)
    }
}

const addCoupon = async(req,res)=>{
    try {
         const{couponCode,percentage,minPrice,maxRedeemAmount,expiryDate}=req.body;
         let coupon = await Coupon.findOne({couponCode:couponCode});
         if(!coupon){
            coupon =await new Coupon({
                couponCode:couponCode,
                percentage:percentage,
                minPrice:minPrice,
                maxRedeemAmount:maxRedeemAmount,
                expiryDate:expiryDate
            })
            await coupon.save()
             
         }
         res.redirect("/admin/coupons");
    } catch (error) {
        console.log(error.message)
    }
}
const loadEditCoupon =async(req,res)=>{
    try {
        const coupon = await Coupon.findOne({_id:req.query.id});
        res.render("editCoupon",{coupon:coupon})
        
    } catch (error) {
        console.log(error.message)
    }

}
const editCoupon = async(req,res)=>{
    try {
        const id = req.query.id;
        console.log('kkkkk',id)
        const {couponCode,percentage,minPrice,maxRedeemAmount,expiryDate} = req.body;
        console.log("lklklk");
        const coupon= await Coupon.updateOne(
            {_id:req.query.id},
            {$set:{
                couponCode:couponCode,
                percentage:percentage,
                minPrice:minPrice,
                maxRedeemAmount:maxRedeemAmount,
                expiryDate:expiryDate

            }
        })
        
        console.log("couponn");
        res.redirect("/admin/coupons")
        
    } catch (error) {
        console.log(error.message)
    }
}

const deleteCoupon = async(req,res)=>{
    try {
        await Coupon.deleteOne({_id:req.query.id});
        res.json({success:true})
        
    } catch (error) {
        console.log(error.message)
    }
}

const checkCoupon = async(req,res)=>{
    try {
        const couponCode  =req.query.couponCode;
        const coupon =await Coupon.findOne({couponCode:req.query.couponCode});
        console.log("codeeeeeeeeee",couponCode);

        if(!coupon){
            return res.json({success:false,message:"Not A valid Coupon "})
        }else if(coupon.minPrice>req.query.totalPrice){
            console.log("totlaaal",req.query.totalPrice);
            return res.json({
                success:false,
                message:"Not eligible for this coupon"
            });

        }else{
            const discountPercentage = coupon.percentage;
            const maxRedeemAmount = coupon.maxRedeemAmount; 

            req.session.totalPrice=req.query.totalPrice
            return res.json({success:true,coupon:coupon.couponCode,discountPercentage: discountPercentage,maxRedeemAmount:maxRedeemAmount})
        }
        
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Internal server error" });

    }
}
const getAvailableCoupons = async(req,res)=>{
    try {
        const coupons = await Coupon.find();// Fetch all available coupons from the database    
        res.json({coupons:coupons})
    } catch (error) {
        
        console.log(error.message)
    }
}
module.exports = {
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    checkCoupon,
    getAvailableCoupons


}



