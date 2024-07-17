const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Wishlist = require("../models/wishlistModel");

const addToWishlist = async (req, res) => {
    try {
        const productId = req.query.productId;
        console.log(`Received product ID: ${productId}`);

        // Find the user's wishlist
        let wishlist = await Wishlist.findOne({ userId: req.session.user_id });

        // If the wishlist doesn't exist, create a new one
        if (!wishlist) {
            wishlist = new Wishlist({
                userId: req.session.user_id,
                items: [{ productId: productId }]
            });
            await wishlist.save();

            console.log('New wishlist created and product added');
            return res.json({ success: true, message: 'Product added to wishlist successfully' });
        } else {
            // Check if the product is already in the wishlist
            let flag = 0;
            wishlist.items.forEach((item) => {
                if (item.productId.toString() === productId) {
                    flag = 1;
                }
            });

            // If the product is not in the wishlist, add it
            if (flag === 0) {
                wishlist.items.push({ productId: productId });
                await wishlist.save();

                console.log("Product added to existing wishlist");
                return res.json({ success: true, message: 'Product added to wishlist successfully' });
            } else {
                console.log("Product is already in the wishlist");
                return res.json({ success: false, message: 'Product is already in the wishlist' });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product to the wishlist' });
    }
};


const loadWishlist = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        let wishlist = await Wishlist.findOne({ userId: req.session.user_id }).populate("items.productId");
        res.render("wishlist", { wishlist: wishlist, user: userData })


    } catch (error) {
        console.log(error.message)
        res.status(500).json({ success: false })
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        console.log("Request received for removing item from wishlist");

        const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
        const index = req.query.index;

        if (wishlist && wishlist.items.length > index) {
            wishlist.items.splice(index, 1);
            await wishlist.save();
            res.json({ success: true })
        } else {
            res.json({ success: false })
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