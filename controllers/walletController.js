const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Wallet = require("../models/walletModel");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET
})


const loadWallet = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        const wallet = await Wallet.findOne({ userId: req.session.user_id })


        res.render("wallet", { user: user, wallet: wallet });

    } catch (error) {
        console.log(error.message)
    }
}
const addMoney = async (req, res) => {
    try {
        console.log("adddd");
        const amount = parseInt(req.query.amount, 10) * 100; // Convert to smallest currency unit
        const receipt = `receipt_${Date.now()}`;  // Generating a unique receipt using timestamp

        const options = {
            amount: amount,
            currency: "INR",
            receipt: receipt,
        };
        console.log(options,"plpllplplpl");
        console.log("aaaaaaaaaaa");
        const order = await razorpay.orders.create(options);
        return res.json({
          success: true,
          message: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: razorpay.key_id,
        });


    } catch (error) {
        console.log(error.message)
    }
}

const addingMoney = async(req,res)=>{
    try {
        console.log("adddingg");
        let wallet = await Wallet.findOne({userId:req.session.user_id});
        if(!wallet){
            wallet = await new Wallet({
                userId:req.session.user_id,
                balance : 0,
                history:[]
            })
        }
        wallet.history.push({
            amount:req.query.amount,
            type:"Credit",
            newBalance:wallet.balance+=Number(req.query.amount),
        });
        wallet.balance +=Number(req.query.amount);
        console.log(wallet,"walleet");
        wallet.save();
        res.redirect('/wallet');
        
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loadWallet,
    addMoney,
    addingMoney

}