const express=require("express");
const admin_route=express();
const multer=require("multer");
const path=require("path")
const auth=require("../middleware/adminAuth");
const config=require("../config/config");
const adminController=require("../controllers/adminController");
const categoryController=require("../controllers/categoryController")
const productController=require("../controllers/productController")


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
admin_route.get("/category/addCategory", categoryController.loadAddCategory);
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
admin_route.get("/product/checkAlready",productController.checkAlready);
admin_route.get('/product/productDetails',productController.getProduct);
// admin_route.get('/product/editProduct',productController.editProduct)
admin_route.get("/product/editProduct",auth.isLogin,productController.loadEditProduct);
admin_route.post( "/product/editProduct",upload.array("photos"),productController.editProduct);
admin_route.post('/product/deleteProduct',productController.deleteProduct);
admin_route.get('/product/deletedProduct',auth.isLogin,productController.loadDeletedProduct);
admin_route.get('/product/restoreProduct',productController.restoreProduct)


//user management
admin_route.get('/userList',auth.isLogin,adminController.loadUser);
admin_route.get("/userList/blockUser",auth.isLogin, adminController.blockUser);
admin_route.get("/userList/unblockUser",auth.isLogin, adminController.unblockUser);

module.exports=admin_route;