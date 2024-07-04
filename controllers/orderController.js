const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const user_route = require("../routes/userRoute");
const ObjectId = mongoose.Types.ObjectId;


const createOrder = async (req, res) => {
    try {
        const cartData = await Cart.findOne({ userId: req.session.user_id }).populate('items.productId').populate({
            path: "items.productId",
            populate: {
                path: "categoryId",
                model: "Category"
            },
        });
        const addressId = new ObjectId(req.body.selectedAddress);
        const addressArray = await Address.aggregate([
            { $unwind: "$address" },
            { $match: { "address._id": addressId } },
        ])
        if (!addressArray || addressArray.length === 0 || !cartData) {
            return res.redirect("/cart")
        }
        const address = addressArray[0].address
        const orderData = await new Order({
            orderId: Math.floor(100000 + Math.random() * 900000),
            userId: req.session.user_id,
            paymentMethod: req.body.paymentMethod,
            totalPrice: req.body.totalprice,
            address: {
                name: address.name,
                mobile: address.mobile,
                pincode: address.pincode,
                house: address.house,
                locality: address.locality,
                city: address.city,
                state: address.state,
            },
            items: [],
        });
        for (const item of cartData.items) {
            let finalPrice = item.productId.price;
            if (item.productId.discountPrice) {
                finalPrice = item.productId.discountPrice
            }
            orderData.items.push({
                productId: item.productId._id,
                productName: item.productId.name,
                categoryName: item.productId.categoryId.name,
                image: item.productId.images[0],
                quantity: item.quantity,
                price: item.productId.price,
                finalPrice: finalPrice,
            })
            await Product.findByIdAndUpdate(
                item.productId._id,
                { $inc: { quantity: -item.stock } }
            )
        }
        if (orderData.paymentMethod === "cod") {
            if (req.body.totalprice > 10000) {
                return res.json({ success: TRUE, message: "Cannot place order in COD" })
            }
            orderData.paymentStatus = "Pending";
        }

        req.session.orderData = orderData;
        res.json({ success: true })


    } catch (error) {
        console.log(error.message);

    }
}

const orderSuccess = async (req, res) => {
    try {
        if (!req.session.orderData) {
            return res.redirect("/shop")
        }
        const userData = await User.findOne({ _id: req.session.user_id })
        const orderData = new Order(req.session.orderData)
        delete req.session.orderData;
        delete req.session.totalPrice

        await orderData.save()
        await Cart.deleteOne({ userId: req.session.user_id })
        res.render("orderSuccess", { user: userData, order: orderData })

    } catch (error) {
        console.log(error.message)
    }
}
const myOrders = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });

        const orderData = await Order.find({ userId: req.session.user_id }).sort({ date: -1 });

        const totalOrders = await Order.countDocuments({ userId: req.session.user_id });
        res.render("myOrders", { user: userData, orders: orderData })


    } catch (error) {
        console.log(error.message)
    }
}
const listOrders = async (req, res) => {
    try {
        orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $sort: { date: -1 } },
          
        ]);

        const totalOrders = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }

            },
            { $unwind: "$user" },
            { $count: "totalOrders" },
        ])

        res.render("orders", { orders: orderData })

    } catch (error) {
        console.log(error.message);
    }
}

const orderDetails = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const order = await Order.findOne({ _id: req.query.orderId });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        res.render("orderDetails", {
            user: userData,
            order: order
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

// const orderDetails = async (req, res) => {
//     try {
//         const userData = await User.findOne({_id: req.session.user_id});
//         const order = await Order.findOne({_id: req.query.orderId});

//         // Find the product within the order's items array
//         const product = order.items.find(item => item.productId.toString() === req.query.pId);

//         // Return only the order items with specific statuses
//         const orders = order.items.filter(item =>
//             ["Ordered", "Shipped", "Delivered"].includes(item.itemStatus)
//         );

//         return res.render("orderDetails", {user: userData, order: order, orders: orders, item: product});
//     } catch (error) {
//         console.log(error.message);
//     }
// };


//  const orderDetails = async(req,res)=>{
//     try {
//         const userData = await User.findOne({_id:req.session.user_id});
//         const order = await Order.findOne({_id:req.query.orderId});
//         const cart = await Cart.findOne({userId:req.session.user_id})


//         order.items.forEach((item) => {
//             if (item.productId == req.query.pId) {
//               const product = item;

//         let orders = order.items.forEach((item)=>{
//             if(item.itemStatus==="Ordered"||item.itemStatus==="Shipped"||item.itemStatus==="Delivered"){
//                 return item;
//             }

//         })
//         return res.render("orderDetails",{user:userData,order:order,orders:orders,item:product})
//     }
// })

//     }catch (error) {
//     console.log(error.message)

// }
//  }


const changeStatus = async(req,res)=>{
    try {
        const order = await Order.findOne({_id:req.query.orderId})
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    createOrder,
    orderSuccess,
    myOrders,
    listOrders,
    orderDetails,
    changeStatus



}