const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Wallet = require("../models/walletModel")


const loadWallet = async(req,res)=>{
    try {
        const user= await User.findOne({_id:req.session.user_id});
        const  wallet = await Wallet.findOne({userId:req.session.user_id})
    

        res.render("wallet" ,{user:user,wallet:wallet});
        
    } catch (error) {
        console.log(error.message)
    }
}
module.exports = {
    loadWallet,

}