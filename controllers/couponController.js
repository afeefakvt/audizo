const Coupon = require("../models/couponModel");
const Product = require("../controllers/productController");
const Category = require("../controllers/categoryController");

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
        console.log('kkkkk')
        const{couponCode,percentage,minPrice,maxRedeemAmount,expiryDate}=req.body;
        console.log("lklklk");
        const coupon = await Coupon.updateOne(
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
module.exports = {
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon


}


