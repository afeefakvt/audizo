const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const { ObjectId } = require('mongodb');



const addToCart = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(`Received product ID: ${id}`);
        const already = await Cart.findOne({ userId: req.session.user_id });
        if (!already) {
            const cartItem = await new Cart({
                userId: req.session.user_id,
                item: [{ productId: id }]
            })
            await cartItem.save();

            return res.json({ success: true });
        } else {
            let flag = 0;
            already.items.forEach((item) => {
                if (item.productId == id) {
                    flag = 1;
                }
            });


            if (flag == 0) {
                await Cart.updateOne(
                    { userId: req.session.user_id },
                    { $push: { items: { productId: id } } }
                )
                console.log("product pushed to cart");

                res.json({ success: true,message:'Product added to cart successfully' })
            } else {
                console.log("Product is already in the cart");
                res.json({ success: false,message:'product is already in the cart' })
            }
        }
    } catch (error) {
        console.log(error.message)
    }
}

// const   addToCart = async(req,res)=>{
//     try{
//         const id = req.query.id;
//         console.log(id,"hhhhh")
//         const userId = req.session.user_id;
//  // Log the product ID to see what is being received
//  console.log(`Received product ID: ${id}`);

//           // Validate if the provided id is a valid ObjectId
//           if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ success: false, message: 'Invalid product ID' });
//         }
//         let cart =  await Cart.findOne({userId});

//         if(!cart){
//             cart =new Cart({
//                 userId,
//                 items:[{productId:mongoose.Types.ObjectId(id),quantity:1}]
//             })
//             await cart.save();
//             console.log(`New cart created for user ${userId} with product ${id}`);

//             return res.json({success:true})
//         }else{
//             let item = cart.items.find(item=> item.productId.toString()===id);
//             if(item){
//                 console.log(`Product ${id} is already in the cart for user ${userId}`);

//                 return res.json({success:false,message:"product already in the cart"})
//             }else{
//                 cart.items.push({productId:mongoose.Types.ObjectId(id),quantity:1});
//                 await cart.save()
// console.log(`Product ${id} added to existing cart for user ${userId}`);
//                 return res.json({success:true});
//             }
//         }

//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({success:false})
//     }
// }



const loadCart = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const cart = await Cart.findOne({ userId: req.session.user_id }).populate("items.productId");
        console.log(`Cart loaded for user ${req.session.user_id}: ${cart}`);

        res.render("cart", { cart: cart, user: userData })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false })
    }
}

const decreaseCart = async (req, res) => {
    try {
        const index = req.query.index;
        const item = await Cart.findOne({ userId: req.session.user_id });
        item.items[index].quantity--;
        item.save()
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
    }

}
const increaseCart = async (req, res) => {
    try {
        const index = req.query.index
        const item = await Cart.findOne({ userId: req.session.user_id })
        item.items[index].quantity++;
        item.save();
        res.json({ success: true })

    } catch (error) {
        console.log(error.message)
    }
}

const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.user_id });
        const index = req.query.index
        console.log(index, "indddddexx")
        if (cart && cart.items.length > index) {
            cart.items.splice(index, 1);
            await cart.save()
            res.json({ success: true })
        } else {
            res.json({ success: false });
        }


    } catch (error) {
        console.log(error.message)
    }
}
const checkStock = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.user_id }).populate('items.productId');
        let isAvailable = true;
        let message;
        for (let item of cart.items) {
            if (item.productId.stock === 0) {
                isAvailable = false;
                message = "some items in your cart is currentlly stock out"
            } else if (item.quantity > item.productId.stock) {
                item.quantity = item.productId.stock;
                await cart.save();
                isAvailable = false;
                message = "quantity of some items in your cart is greater than currently available stock"
            }
        }
        if (isAvailable) {
            res.json({ success: true, message: "all items are available" })

        } else {
            res.json({ success: false, message: message })
        }



    } catch (error) {
        console.log(error.message)
    }
}

const loadCheckout = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const addresses = await Address.findOne({ userId: req.session.user_id })
        const cart = await Cart.findOne({ userId: req.session.user_id }).populate("items.productId");

        if (cart && cart.items.length > 0) {
            let grandTotal = 0;
            cart.items.forEach(item => {
                grandTotal += item.productId.discountPrice * item.quantity;
            });
            res.render("checkout", { user: userData, cart: cart, addresses: addresses, grandTotal: grandTotal })
        } else {
            res.redirect('/cart');
        }
    } catch (error) {
        console.log(error.message)
    }
}
const addNewAddress = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        let address = await Address.findOne({ userId: userData._id });
        if (!address) {
            address = await new Address({
                userId: userData._id,
                address: [],
            })
        }
        const { name, mobile, pincode, house, locality, city, state, } = req.body;
        address.address.push({
            name: name,
            mobile: mobile,
            pincode: pincode,
            house: house,
            locality: locality,
            city: city,
            state: state
        })
        await address.save();

        res.redirect("/checkout")


    } catch (error) {
        console.log(error.message)
    }
}
module.exports = {
    addToCart,
    loadCart,
    removeFromCart,
    decreaseCart,
    increaseCart,
    checkStock,
    loadCheckout,
    addNewAddress,


}


