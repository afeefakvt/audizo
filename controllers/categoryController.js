const express=require('express');
const Category = require("../models/categoryModel");
const Product = require("../models/productModel")
const { loadAddProduct } = require('./productController');

const loadCategory = async (req, res) => {
    try {
        const categoryData = await Category.find({isBlocked:false});
        console.log("ssss")
        res.render('category', { categoryData })
    } catch (error) {
      res.send(error)

    }
}
const loadAddCategory = async (req, res,next) => {
    try {
      res.render("addCategory");
    } catch (error) {
      res.send(error)
    }
  };
  
const addCategory = async (req, res) => {
    try {
        const { name } = req.query;
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.json({success:false});
        }
        const category = new Category({
            name
        });
        await category.save();
        res.json({success:true})
    } catch (error) {
        res.send(error)
    }
}

const loadEditCategory = async (req, res,next) => {

    try {
        const id = req.query.id;
        const category = await Category.findOne({ _id: id });
        if(category){
      res.render("editCategory",{category:category});
        }
    } catch (error) {
      console.log(error.message);
    }
  };

  const editCategory = async (req, res,next) => {
    try {
      const already = await Category.findOne({name:req.body.name});
      if(already){
        return res.redirect("/admin/category");
      }
      await Category.findByIdAndUpdate(
        { _id: req.query.id },
        { $set: { name: req.body.name } }
      );
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  };
  const deleteCategory = async (req, res,next) => {
    console.log("hhhh")
    try {
      let updated = await Category.findByIdAndUpdate(
        { _id: req.query.id },
        { $set: { isBlocked: true } }
      );
      console.log(updated,"ytytyt")
      if(updated){
          res.json({ success: true });
      }
    } catch (error) {
      next(error);
    }
  };



// const deleteCategory = async (req, res) => {
//     try {

//         const {name,id}=req.body;
//         const categoryItem = await Category.findById({ id });
//         if (categoryItem) {
//             await Category.findByIdAndUpdate({ id }, {
//                 isBlocked:true
//             })
//             res.status(201).json({ message: "Category deleted" });
//         } else {
//             res.status(404).json({ message: "Category not found" });
//         }


//     } catch (error) {
//         console.log(error.message)
//     }
// }

const loadDeletedCategory=async(req,res)=>{
    try{
        const deletedCategories= await Category.find({isBlocked:true});
        res.render('deletedCategory',{category:deletedCategories})

    }catch(error){
        console.log(error.message)
        res.status(500).send("Server Error")
    }
}

const restoreCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const categoryItem = await Category.findById(categoryId);
        if (categoryItem) {
            await Category.findByIdAndUpdate(categoryId, { isBlocked: false });
            res.status(200).json({ message: "Category restored successfully",success:true });
        } else {
            res.status(404).json({ message: "Category not found" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    deleteCategory,
    loadDeletedCategory,
    restoreCategory

}