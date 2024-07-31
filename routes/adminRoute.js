const express=require("express");
const admin_route=express();
const multer=require("multer");
const path=require("path")
const auth=require("../middleware/adminAuth");
const config=require("../config/config");
const adminController=require("../controllers/adminController");
const categoryController=require("../controllers/categoryController")
const productController=require("../controllers/productController")
const orderController=require("../controllers/orderController")
const couponController=require("../controllers/couponController");
const offerController=require("../controllers/offerController");
const user_route = require("./userRoute");


admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));


admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userImages/images'));
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const upload=multer({storage:storage})



//admin management
admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/verifyLogin',adminController.verifyLogin);
admin_route.get('/home',auth.isLogin,adminController.loadDashboard);
admin_route.get('/logout',auth.isLogin,adminController.logout);

//category management
admin_route.get("/category",auth.isLogin,categoryController.loadCategory)
admin_route.get("/category/addCategory",auth.isLogin, categoryController.loadAddCategory);
admin_route.post('/category/addCategory',categoryController.addCategory)
admin_route.get("/category/editCategory",auth.isLogin, categoryController.loadEditCategory);
admin_route.post('/category/editCategory',categoryController.editCategory);
admin_route.delete('/category/deleteCategory',categoryController.deleteCategory);
admin_route.get('/category/deletedCategory',auth.isLogin,categoryController.loadDeletedCategory);
admin_route.get('/category/restoreCategory',auth.isLogin,categoryController.restoreCategory);


//product management
admin_route.get('/product',auth.isLogin,productController.loadProduct);
admin_route.get('/product/addProduct',auth.isLogin,productController.loadAddProduct);
admin_route.post('/product/addProduct',upload.array('photos',12),productController.addProduct);
admin_route.get("/product/checkAlready",productController.checkAlready)
admin_route.get("/product/editProduct",auth.isLogin,productController.loadEditProduct);
admin_route.post( "/product/editProduct",upload.array("photos"),productController.editProduct);
admin_route.post('/product/deleteProduct',productController.deleteProduct);
admin_route.get('/product/deletedProduct',auth.isLogin,productController.loadDeletedProduct);
admin_route.get('/product/restoreProduct',productController.restoreProduct)


//user management
admin_route.get('/userList',auth.isLogin,adminController.loadUser);
admin_route.get("/userList/blockUser",auth.isLogin, adminController.blockUser);
admin_route.get("/userList/unblockUser",auth.isLogin, adminController.unblockUser);

//order management
admin_route.get("/orders",auth.isLogin,orderController.listOrders);
admin_route.get("/orders/changeStatus",auth.isLogin,orderController.changeStatus);
admin_route.get("/orders/approveReturn",auth.isLogin,orderController.approveReturn)

//coupon management
admin_route.get("/coupons",auth.isLogin,couponController.loadAddCoupon);
admin_route.post("/coupons/addCoupon",couponController.addCoupon);
admin_route.get("/coupons/editCoupon",couponController.loadEditCoupon);
admin_route.post("/coupons/editCoupon",couponController.editCoupon);
admin_route.delete("/coupons",auth.isLogin,couponController.deleteCoupon);


//offer managmenet
admin_route.get("/productOffer",auth.isLogin,offerController.loadProductOffer);
admin_route.post("/productOffer",auth.isLogin,offerController.addProductOffer);
admin_route.delete("/productOffer",auth.isLogin,offerController.deleteProductOffer);
admin_route.get("/categoryOffer",auth.isLogin,offerController.loadCategoryOffer);
admin_route.post("/categoryOffer",auth.isLogin,offerController.addCategoryOffer);
admin_route.delete("/categoryOffer",auth.isLogin,offerController.deleteCategoryOffer);

//sales report
admin_route.get('/filterSalesInterval',auth.isLogin,adminController.filterSalesInterval);
admin_route.get("/filterSales",auth.isLogin,adminController.filterSalesReport)
admin_route.get("/salesReport",auth.isLogin,adminController.loadSalesReport);


admin_route.use((err,req,res,next)=>{
    console.error('error:',err);
    res.status(500).render("error",{error:err.message})
  })

module.exports=admin_route;
