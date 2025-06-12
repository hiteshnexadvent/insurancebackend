const express = require('express');
const router = express.Router(); 
const coverimagemong = require('../models/BlogCover.Mong');
const userMong = require('../models/UserQuery_Mong');
const reviewMong = require('../models/Review_Mong');
const multer = require('multer');
const path = require('path');
const sendMailtoAdmin = require('../utils/SendMail');
const blogController = require('../controllers/blogController');
const adminAuthentication = require('../controllers/adminAuthentication');
const scheduleController = require('../controllers/scheduleController');

const { validationResult } = require('express-validator');
const { registeredValidator } = require('../validation/validation');



router.get('/signup', (req, res) => {
    res.render('adminSignup');
})

router.post('/signup', adminAuthentication.postadminSignup);


router.get('/login', adminAuthentication.getadminLogin);


router.post('/login', adminAuthentication.postadminLogin);


router.get('/verify-otp', adminAuthentication.getVerifyOtp);

router.post('/verify-otp', adminAuthentication.postVerifyOtp);


// ---------------------------- resend verify otp

router.post('/resend-otp', adminAuthentication.postResendOtp);




router.get('/dashboard', adminAuthentication.getadminDashboard);

// ------------------------------- forget password

router.get('/forget-password', (req, res) => {
    res.render('forgetPass');
})

router.post('/forget-password', adminAuthentication.postforgetPassword);

// ------------------------------ verify

router.post('/verify-forgetotp', adminAuthentication.postverifyforgetPassword);

// ---------------------------- verify forget resend otp


router.post('/resend-forgetotp', adminAuthentication.postresendForgetotp);



// ---------------------------- update forget password

router.get('/update-pass', adminAuthentication.getupdateforgetpassword);

router.post("/update-pass", adminAuthentication.postupdateforgetPassword);




// -------------------------------- change password route dashboard

router.get('/update-password', adminAuthentication.getdashPass);

router.post('/update-password', adminAuthentication.postdashPass);

// ---------------------------------- multer for blogs

const mystorage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
})

const upload = multer({
    storage: mystorage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const fileType = /jpg|jpeg|avif|png|webp/;
        const extname = fileType.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileType.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Image format not supported"));
        }
    }
})

// ---------------------------------- add blogs


router.get('/add-blog', blogController.getaddBlogPage);

router.post('/add-blog', upload.array('image', 5), blogController.postaddBlogPage);

// -------------------------------- manage blogs

router.get('/manage-blog', blogController.manageBlogPage);

router.get('/manage-blogapi', blogController.manageBlogPageapi);

// ---------------------------------- edit blogs

router.get('/edit-blog/:id', blogController.editBlogPage);

// --------------------------------- update blogs

router.post("/edit-blog/:id", blogController.updateBlogs);

// --------------------------------------- delete blog

router.get('/delete-blog/:id', blogController.deleteBlogs);

// --------------------------------------- edit image

router.get("/edit-image/:imgid/:imgindex", blogController.getEditImage);

router.post(
  "/edit-image/:imgid/:imgindex",
  upload.single("file"),blogController.postEditImage
);

// ---------------------------------- delete image

router.get('/delete-image/:imgid/:imgindex', blogController.deleteImage);

// ---------------------------------- page cover image

const uploadcoverimage = multer({
    storage: mystorage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const fileType = /jpg|jpeg|avif|png|webp/;
        const extname = fileType.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileType.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Image format not supported"));
        }
    }
})

router.get('/add-cover', (req, res) => {

    if (!req.session.adminEmail) {
       return res.render('adminLogin',{ siteKey: process.env.RECAPTCHA_SITE_KEY });
    } else {

        res.render('AddCoverImg');
    }
})

router.post('/add-coverpage-image',uploadcoverimage.single('image'),async (req,res) => {

    try {
        
    const coverImagePath = `/uploads/${req.file.filename}`;
    const newCoverimg = new coverimagemong({
        image: coverImagePath
    })
        
        await newCoverimg.save();
        return res.send('<script>alert("image added successfully")</script>');

    }
    catch (err) {
        console.log(err);
    }

    
})

// --------------------------------- manage cover image

router.get('/manage-cover',async (req,res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
    } 
    try {
        
        const coverimage = await coverimagemong.findOne();

        res.render('manageCoverImg', { coverimage });

    }
    catch (err) {
        console.log(err);
    }
})

router.get('/manage-coverapi',async (req,res) => {
    try {
        
        const coverimage = await coverimagemong.findOne();

        res.json(coverimage);

    }
    catch (err) {
        console.log(err);
    }
})

router.post("/edit-coverimage/:imgid", uploadcoverimage.single("file"), async (req, res) => {
  try {
    const { imgid } = req.params;
    const file = req.file;

    if (!file) return res.send("No file uploaded");

    const cover = await coverimagemong.findById(imgid);
    if (!cover) return res.send("Cover not found");

    const newImagePath = `/uploads/${file.filename}`;
    cover.image = newImagePath;

    await cover.save();
    return res.send('<script>alert("Image updated successfully"); window.location.href="/admin/manage-cover";</script>');
  } catch (err) {
    res.send("Something went wrong");
  }
});


// ----------------------------------- contact form

router.post('/user-details', registeredValidator, async (req, res) => {

    try {
        const { name, email, mobile, city, message } = req.body;
        
        const error = validationResult(req);

        if (!error.isEmpty()) {
        return res.status(400).json({ message: error.array()[0].msg });
        
        }
        

        const exist = await userMong.findOne({ email });

        if (exist) {
            return res.status(409).json({ message: 'user already registerd' });
            
        }

        const newUser = new userMong({
            name, email,mobile, city, message
        })

        await newUser.save();
        await sendMailtoAdmin({ name, email,mobile, city, message });
        return res.status(201).json({message:'User registerd successfull'});

    }
    catch (err) {
        return res.status(500).json({message:err.message});
    }
})

// ---------------------------- manage users

router.get('/manage-user', async(req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
    }

    try {
        const userr = await userMong.find();

        res.render('userInfo', { userr });
    }
    catch (err) {
        res.send('error occured');
    }
})

router.get('/delete-user/:id',async (req,res) => {
    
    try {
                await userMong.findByIdAndDelete(req.params.id);
                return res.redirect('/admin/manage-user');
            } catch (err) {
                return res.send('cannot delete at this time');
            }
    

})

// ----------------------------- reviews

router.get('/add-review', (req, res) => {
   if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
   } else {
        res.render('addReview');
    }
       
})

const uploadReview = multer({
    storage: mystorage,
    limits: {
        fileSize: 15 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const fileType = /jpg|jpeg|avif|png|webp/;
        const extname = fileType.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileType.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Image format not supported"));
        }
    }
})

router.post('/add-review',uploadReview.single('image'),async (req,res) => {
  try{
      const { name, review } = req.body;
      
      const imagePath = `/uploads/${req.file.filename}`;

    const newReview = new reviewMong({
        name, review, image: imagePath
    })

    await newReview.save();
    return res.send('<script>alert("Thanks"); window.history.back();</script>')
  }
  catch (err) {
    res.send(err);
  }
})

// ------------------------------ delete review

router.get('/delete-review/:id',async (req,res) => {
      
       try {
              await reviewMong.findByIdAndDelete(req.params.id);
              return res.redirect('/admin/manage-review');
          } catch (err) {
              return res.send('cannot delete at this time');
          }
  

})

router.get('/manage-review',async (req,res) => {
  try {
    const review = await reviewMong.find();

      return res.render('manageReview', { review });
  }
  catch (err) {
    res.send(err);
  }
})

router.get('/manage-reviewapi',async (req,res) => {
  try {
    const review = await reviewMong.find();

      return res.json(review);
  }
  catch (err) {
    res.json(err);
  }
})

// -------------------------- schedule

router.post('/schedule', scheduleController.postSchedule);

router.get('/manage-schedule', scheduleController.getmanageSchedule);

router.get('/delete-schedule/:id', scheduleController.deleteSchedule);


// --------------------------- sign out

router.get('/signout', (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).send('Unable to log out');
            }
            res.redirect('/admin/login'); 
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Something went wrong');
    }
});


module.exports = router;