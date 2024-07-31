const express = require('express');
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const sharp = require("sharp");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const fs = require('fs');
const path = require('path');

// const fs = require('fs');
// const session=require('session');

const loadProduct = async (req, res) => {
  try {
    let search = "";
    if(req.query.search){
      search= req.query.search;
    }
    const page = parseInt(req.query.page)||1;
    const skip = (page-1)*5

    let productData = await Product.aggregate([
      {
        $match: {
          name: { $regex: ".*" + search + ".*", $options: "i" },
          isListed: false,
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {$sort: {date:-1}}
    ])
    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isListed: false,
    });

    productData = productData.slice(skip,skip+5);
    const totalPages = Math.ceil(totalProducts / 5);


    res.render("product", { product: productData,currentPage:page,totalPages:totalPages,search:search })

  } catch (error) {
    console.log(error.message)
  }
}

const loadAddProduct = async (req, res, next) => {
  try {
    const category = await Category.find({ isBlocked: false });

    res.render("addProduct", { category: category });
  } catch (error) {
    next(error);
  }
};

// const checkAlready = async (req, res, next) => {
//   try {
//     const productName = req.query.productName.trim(); 
//     const already = await Product.find({
//       name: { $regex: `^${productName}$`, $options: "i" },
//     });
//     if (already.length > 0) {
//       return res.json({ success: false });
//     } else {
//       return res.json({ success: true });
//     }
//   } catch (error) {
//     next(error);
//   }
// };


const checkAlready = async (req, res, next) => {
  try {
    const productName = req.query.productName.trim();
    const id = req.query.id || null;

    const query = {
      name: { $regex: `^${productName}$`, $options: "i" }
    };

    if (id) {
      query._id = { $ne: id };
    }

    const already = await Product.find(query);
    if (already.length > 0) {
      return res.json({ success: false });
    } else {
      return res.json({ success: true });
    }
  } catch (error) {
    next(error);
  }
};


const addProduct = async (req, res, next) => {
  try {
    const { productName, category, price,  quantity, productDescription } = req.body;
    console.log('Category:', category);

    const categoryId = category.trim();
    let ObjectId = new mongoose.Types.ObjectId(categoryId);
    const product = new Product({
      name: productName,
      categoryId: category,
      price: price,
      stock: quantity,
      description: productDescription,
      images: req.files.map(file => file.filename),
      date: new Date(),
    });
    console.log("kkkk")
    await product.save();
    res.redirect("/admin/product");
  } catch (error) {
    next(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.find({ isBlocked: false });
    const prod = await Product.findOne({ _id: id });
    if (!prod) {
      return res.status(404).send('Product not found');
    }
    const product = await Product.aggregate([
      { $match: { _id: prod._id } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    if (product.length > 0) {
      res.render("editProduct", { product: product, category: category });
    }
    else {
      res.status(404).send('Product details not found');
    }

  } catch (error) {
    console.log(error.message)
  }
}


const editProduct = async (req, res, next) => {
  try {
    const { categoryName, productName, price,  quantity, productDescription } = req.body;
    const id = req.query.id;
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      throw new Error('Category not found');
    }

    const product = await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: productName,
          categoryId: category._id,
          price: price,
          stock: quantity,
          description: productDescription,
        },
      },
      { new: true }
    );
    // If there are deleted images indices
    if (req.body.deletedIndices) {
      const deletedIndices = JSON.parse(req.body.deletedIndices);
      for (let index of deletedIndices) {
        product.images.splice(Number(index), 1);
      }
    }
  // Set up the upload directory
    const uploadDir = path.join(__dirname, '..', 'public', 'userImages', 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `cropped_${uniqueSuffix}_${file.originalname}`;
      const filepath = path.join(uploadDir, filename);

      await sharp(file.path)
        .resize({ width: 600, height: 600, fit: "cover" })
        .toFile(filepath);

      product.images.push(filename);
    }
    await product.save();
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
    next(error);
  }
};



const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    await Product.findByIdAndUpdate({ _id: productId }, { $set: { isListed: true } });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.send(error);
  }
};


const loadDeletedProduct = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 5;

    const productData = await Product.aggregate([
      {
        $match: {
          name: { $regex: ".*" + search + ".*", $options: "i" },
          isListed: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {$unwind:"$category"},
      { $skip: skip },
      { $limit: 5 },

    ])
    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isListed: true,
    });
    const totalPages = Math.ceil(totalProducts / 5);

    res.render("deletedProduct", { product: productData ,currentPage:page,totalPages:totalPages})
  } catch (error) {
    console.log(error.message);
  }
}



const restoreProduct = async (req, res) => {
  try {

    const productId = req.query.id;
    const productData = await Product.findByIdAndUpdate(productId, { isListed: false }, { new: true });
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product restored successfully' });

  } catch (error) {
    console.log(error.message)
  }
}





module.exports = {
  loadProduct,
  loadAddProduct,
  checkAlready,
  addProduct, 
  loadEditProduct,
  editProduct,
  deleteProduct,
  loadDeletedProduct,
  restoreProduct

}