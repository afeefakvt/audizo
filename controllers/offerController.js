const CategoryOffer = require("../models/categoryOfferModel");
const ProductOffer = require("../models/productOfferModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");



const loadProductOffer = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * 5;
    
        const products = await Product.find({isListed:false});
        const category = await Category.find({isBlocked:false});
        const productOffers = await ProductOffer.find().populate("productId").skip(skip).limit(5);

        const totalProductOffer = await ProductOffer.countDocuments()
        const totalPages = Math.ceil(totalProductOffer / 5);

        res.render("productOffer",{products:products,category:category,productOffers:productOffers,currentPage:page,totalPages:totalPages});
    } catch (error) {
        console.log(error.message)
    }
}
const addProductOffer = async(req,res)=>{
    try {
        const {productName,offerPercentage,expiryDate} = req.body;
        let productOffer = await ProductOffer.findOne({productId:productName});
        if(!productOffer){
            productOffer = await new ProductOffer({
                productId:productName,
                offerPercentage:offerPercentage,
                expiryDate:expiryDate

            })
        }else{
            productOffer.offerPercentage=offerPercentage;
            productOffer.expiryDate = expiryDate;

        }
        productOffer.save()
        res.redirect("/admin/productOffer")
        
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteProductOffer = async(req,res)=>{
    try {
        const offer = await ProductOffer.deleteOne({_id:req.query.id})
        res.json({success:true})

    } catch (error) {
        console.log(error.message)
    }
}
const loadCategoryOffer = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const products  =await Product.find({isListed:false});
        const category= await Category.find({isBlocked:false});
        const categoryOffers = await CategoryOffer.find().populate("categoryId").skip(skip).limit(5);
        
        const totalCategoryOffer = await CategoryOffer.countDocuments()
        const totalPages = Math.ceil(totalCategoryOffer / 5);
        res.render("categoryOffer",{products:products,category:category,categoryOffers:categoryOffers,totalPages:totalPages,currentPage:page});      
    } catch (error) {
        console.log(error.message)
    }
}

const addCategoryOffer = async(req,res)=>{
    try {

        const {categoryName,offerPercentage,expiryDate}=req.body;
        let categoryOffer = await CategoryOffer.findOne({categoryId:categoryName});
        if(!categoryOffer){
            categoryOffer = await new CategoryOffer({
                categoryId:categoryName,
                offerPercentage:offerPercentage,
                expiryDate:expiryDate
            })

        }else{
            categoryOffer.offerPercentage = offerPercentage;
            categoryOffer.expiryDate = expiryDate
        }
        categoryOffer.save();
        res.redirect("/admin/categoryOffer")
        
    } catch (error) {
        console.log(error.message)
    }
}
const deleteCategoryOffer = async(req,res)=>{
    try {
        const offer = await CategoryOffer.deleteOne({_id:req.query.id})
        res.json({success:true})
        
    } catch (error) {
        console.log(error.message)
        
    }
}

module.exports = {
    loadProductOffer,
    addProductOffer,
    deleteProductOffer,
    loadCategoryOffer,
    addCategoryOffer,
    deleteCategoryOffer,


}