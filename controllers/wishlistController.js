const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Wishlist = require("../models/wishlistModel");

const addToWishlist = async(req,res)=>{
    try{
        const productId = req.query.productId;
  
        const already = await Wishlist.findOne({userId:req.session.user_id})
        if(!already){
            const wishlistItem = await new Wishlist({
                userId:req.session.user_id,
                item:[{productId:productId}]
            })
            await wishlistItem.save()
            return res.json({success:true})
        }else{
            let flag = 0;
            already.items.forEach((item) => {
                if (item.productId == productId) {
                    flag = 1;
                }
            });


             if(flag==0){
                await Wishlist.updateOne(
                    {userId:req.session.user_id},
                    {$push:{items:{productId:productId}}}
                )
                console.log("added to wishlistt")
                res.json({success:true,message:'product added to wishlist'});
            }else{
                console.log("Product is already in the cart");
                res.json({ success: false,message:'product is already in the wishlist' })
            }
        }

    } catch(error){
        console.log(error.message)
    }
}

const loadWishlist = async(req,res)=>{
    try{
        const userData = await User.findOne({_id:req.session.user_id})
        let wishlist =  await Wishlist.findOne({userId:req.session.user_id}).populate("items.productId");
        res.render("wishlist",{wishlist:wishlist, user:userData})


    }catch(error){
        console.log(error.message)
        res.status(500).json({ success: false })
    }
}

const removeFromWishlist = async(req,res)=>{
    try {
        console.log("Request received for removing item from wishlist");

        const wishlist = await Wishlist.findOne({userId:req.session.user_id});
        const index = req.query.index;

        if(wishlist && wishlist.items.length > index){
            wishlist.items.splice(index,1);
            await wishlist.save();
            res.json({success:true})
        }else{
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error.message)
        
    }
}

module.exports = {
    addToWishlist,
    loadWishlist,
    removeFromWishlist,

}