const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Coupon = require("../models/couponModel")
const { ObjectId } = require('mongodb');

const addToCart = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(`Received product ID: ${id}`);

        // Find the user's cart
        let cart = await Cart.findOne({ userId: req.session.user_id });

        // If the cart doesn't exist, create a new one
        if (!cart) {
            cart = new Cart({
                userId: req.session.user_id,
                items: [{ productId: id }]
            });
            await cart.save();

            console.log('New cart created and product added');
            return res.json({ success: true, message: 'Product added to cart successfully' });
        } else {
            // Check if the product is already in the cart
            let flag = 0;
            cart.items.forEach((item) => {
                if (item.productId.toString() === id) {
                    flag = 1;
                }
            });

            // If the product is not in the cart, add it
            if (flag === 0) {
                cart.items.push({ productId: id });
                await cart.save();

                console.log("Product added to existing cart");
                return res.json({ success: true, message: 'Product added to cart successfully' });
            } else {
                console.log("Product is already in the cart");
                return res.json({ success: false, message: 'Product is already in the cart' });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product to the cart' });
    }
};


// const addToCart = async (req, res) => {
//     try {
//         const id = req.query.id;
//         console.log(`Received product ID: ${id}`);
//         let cart= await Cart.findOne({ userId: req.session.user_id });
//         if (!cart) {
//                 cart=  new Cart({
//                 userId: req.session.user_id,
//                 item: [{ productId: id }]
//             })
//             await cart.save();

//             return res.json({ success: true });
//         } else {
//             let flag = 0;
//             cart.items.forEach((item) => {
//                 if (item.productId == id) {
//                     flag = 1;
//                 }
//             });


//             if (flag == 0) {
//                 await Cart.updateOne(
//                     { userId: req.session.user_id },
//                     { $push: { items: { productId: id } } }
//                 )
//                 console.log("product pushed to cart");

//                 res.json({ success: true, message: 'Product added to cart successfully' })
//             } else {
//                 console.log("Product is already in the cart");
//                 res.json({ success: false, message: 'product is already in the cart' })
//             }
//         }

//     } catch (error) {
//         console.log(error.message)
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
        const addresses = await Address.findOne({ userId: req.session.user_id });
        const cart = await Cart.findOne({ userId: req.session.user_id }).populate("items.productId");
        const coupon = await Coupon.find();

        let discount = 0;
        let appliedCouponCode = null;
        if (req.query.coupon) {
            const appliedCoupon = await Coupon.findOne({ couponCode: req.query.coupon });
            appliedCouponCode = req.query.coupon;
            discount = Math.ceil((appliedCoupon.percentage * req.session.totalPrice) / 100);
            if (discount > appliedCoupon.maxRedeemAmount) {
                discount = appliedCoupon.maxRedeemAmount;
            }
        }
        if (req.session.discount) {
            discount = req.session.discount;
            delete req.session.discount;
        }

        if (cart && cart.items.length > 0) {
            let grandTotal = 0;
            cart.items.forEach(item => {
                const price = item.productId.discountPrice ? item.productId.discountPrice : item.productId.price;
                grandTotal += price * item.quantity;
                    });
            const finalTotal = grandTotal - discount;
            res.render("checkout", {
                user: userData,
                cart: cart,
                addresses: addresses,
                grandTotal: grandTotal,
                finalTotal: finalTotal,
                coupon: coupon,
                discount: discount,
                appliedCouponCode: appliedCouponCode
            });
        } else {
            res.redirect('/cart');
        }
    } catch (error) {
        console.log(error.message);
    }
};

// const loadCheckout = async (req, res) => {
//     try {
//         const userData = await User.findOne({ _id: req.session.user_id });
//         const addresses = await Address.findOne({ userId: req.session.user_id })
//         const cart = await Cart.findOne({ userId: req.session.user_id }).populate("items.productId");
//         const coupon = await Coupon.find();

//         let discount;
//         if (req.query.coupon) {
//             const appliedCoupon = await Coupon.findOne({ couponCode: req.query.coupon });
//             discount = Math.ceil(
//                 (appliedCoupon.percentage * req.session.totalPrice) / 100
//             );
//             if (discount > appliedCoupon.maxRedeemAmount) {
//                 discount = appliedCoupon.maxRedeemAmount;
//             }
//         }
//         if (req.session.discount) {
//             discount = req.session.discount;
//             delete req.session.discount;
//         }

//         if (cart && cart.items.length > 0) {
//             let grandTotal = 0;
//             cart.items.forEach(item => {
//                 grandTotal += item.productId.discountPrice * item.quantity;
//             });
//             res.render("checkout", { user: userData, cart: cart, addresses: addresses, grandTotal: grandTotal, coupon: coupon, discount: discount })
//         } else {
//             res.redirect('/cart');
//         }
//     } catch (error) {
//         console.log(error.message)
//     }
// }
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


