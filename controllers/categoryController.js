const express = require('express');
const Category = require("../models/categoryModel");
const Product = require("../models/productModel")
const { loadAddProduct } = require('./productController');

const loadCategory = async (req, res) => {
  try {
    const categoryData = await Category.find({ isBlocked: false });
    console.log("ssss")
    res.render('category', { categoryData })
  } catch (error) {
    res.send(error)

  }
}
const loadAddCategory = async (req, res) => {
  try {
    res.render("addCategory");
  } catch (error) {
    res.send(error)
  }
};

const addCategory = async (req, res) => {
  console.log("jkjkjkj");
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status.json({ success: false, message: 'Category name cannot be empty' });
    }
    const existingCategory = await Category.findOne({ name });
    console.log("llllllll");
    if (existingCategory) {
      return res.json({ success: false, message: 'Category already exists' });
    }
    const category = new Category({
      name: name.trim()
    });
    await category.save();
    res.json({ success: true })
  } catch (error) {
    res.send(error)
  }
}

const loadEditCategory = async (req, res) => {

  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });
    if (category) {
      res.render("editCategory", { category: category });
    }
  } catch (error) {
    console.log(error.message);
  }
};


const editCategory = async (req, res) => {
  try {
    const already = await Category.findOne({name:req.body.categoryName});
    if(already){
      return res.redirect("/admin/category");
    }
    await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { name: req.body.categoryName } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    console.logt(error.message);
  }
};

const deleteCategory = async (req, res, next) => {
  console.log("hhhh")
  try {
    let updated = await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { isBlocked: true } }
    );
    console.log(updated, "ytytyt")
    if (updated) {
      res.json({ success: true });
    }
  } catch (error) {
    next(error);
  }
};

const loadDeletedCategory = async (req, res) => {
  try {
    const deletedCategories = await Category.find({ isBlocked: true });
    res.render('deletedCategory', { category: deletedCategories })

  } catch (error) {
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
      res.status(200).json({ message: "Category restored successfully", success: true });
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