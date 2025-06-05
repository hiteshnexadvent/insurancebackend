const express = require('express');
const router = express.Router(); 
const adminMong = require('../models/Admin_Mong');
const coverimagemong = require('../models/BlogCover.Mong');
const userMong = require('../models/UserQuery_Mong');
const reviewMong = require('../models/Review_Mong');
const multer = require('multer');
const path = require('path');
const sendMailtoAdmin = require('../utils/SendMail');
const sendOtptoAdmin = require('../utils/sendotp');
const forgetPasswordOtp = require('../utils/forgetotp');
const blogController = require('../controllers/blogController');
const axios = require('axios');

router.get('/login', (req, res) => {
    res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
})


router.post('/login', async (req, res) => {
    const { email, pass, 'g-recaptcha-response': recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.send('<script>alert("Please complete the CAPTCHA"); window.history.back();</script>');
    }

    // Google reCAPTCHA secret key
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    try {
        // Verify captcha with Google
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`
        );

        if (!response.data.success) {
            return res.send('<script>alert("Captcha verification failed"); window.history.back();</script>');
        }

        // Proceed with login
        const admin = await adminMong.findOne({ email });

        if (!admin) {
            return res.send('<script>alert("Admin does not exist"); window.history.back();</script>');
        }

        if (admin.pass === pass) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            req.session.otp = otp;
            req.session.tempAdmin = { email: admin.email, name: admin.name };

            await sendOtptoAdmin(admin.email, otp); // Send OTP

            return res.redirect('/admin/verify-otp');
        } else {
            return res.send('<script>alert("Incorrect Password")</script>');
        }
    } catch (err) {
        console.error(err);
        return res.send('<script>alert("Error occurred, please try again later")</script>');
    }
});


router.get('/verify-otp', (req, res) => {
    if (!req.session.tempAdmin) return res.redirect('/admin/login');
    res.render('otpVerify'); // EJS form to enter OTP
});

router.post('/verify-otp', async(req, res) => {
    const { enteredOtp } = req.body;

    try {
        if (parseInt(enteredOtp) === req.session.otp) {
        req.session.adminEmail = req.session.tempAdmin;

        // Clear temp values
        delete req.session.tempAdmin;
        delete req.session.otp;

            return res.redirect('/admin/dashboard');
          
        }
          else {
        return res.send('<script>alert("Invalid OTP"); window.location="/admin/verify-otp";</script>');
    }
    } catch (err) {
        console.log(err.message);
    }
     
});



router.get('/dashboard', (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
    } else {
        const { email,name } = req.session.adminEmail;
        res.render('adminDash', { email, name });
    }
})

// ------------------------------- forget password

router.get('/forget-password', (req, res) => {
    res.render('forgetPass');
})

router.post('/forget-password',async (req,res) => {
    
    try {
        
    const { email } = req.body;

        const existadmin = await adminMong.findOne({ email });

        if (!existadmin) {
            return res.send('<script>alert("Admin not exist"); window.history.back();</script>');
        }
        // else {
        //     res.redirect(`/admin/update-pass?email=${email}`);
        // }


        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpires = Date.now() + 5 * 60 * 1000;

  existadmin.otp = otp;
  existadmin.otpExpires = otpExpires;
  await existadmin.save();

  await forgetPasswordOtp(email, otp); 

  res.send(`
    <form action="/admin/verify-forgetotp" method="POST">
      <input type="hidden" name="email" value="${email}" />
      Enter OTP: <input type="text" name="otp" required />
      <button type="submit">Verify OTP</button>
    </form>
  `);


    }
    catch (err) {
        res.send('err');
    }

})

// ------------------------------ verify

router.post('/verify-forgetotp', async (req, res) => {
  const { email, otp } = req.body;

  const admin = await adminMong.findOne({ email });

  if (!admin) return res.send('<script>alert("Admin not found"); window.history.back();</script>');



  if (admin.otp.toString() !== otp.toString()) return res.send('<script>alert("Invalid Otp"); window.history.back();</script>');;

  if (Date.now() > admin.otpExpires) return res.send('<script>alert("Otp expired"); window.history.back();</script>');

  // Clear OTP after successful verification
  admin.otp = null;
  admin.otpExpires = null;
  await admin.save();

  // Redirect to update password page
  return res.redirect(`/admin/update-pass?email=${email}`);
});





// ---------------------------- update password

router.get('/update-pass',async (req,res) => {
    
    const { email } = req.query;

    if (!email) {
        return res.send('<script>alert("Email is required"); window.history.back();</script>');
    }
    return res.render('updatePass',{email});

})

router.post("/update-pass", async (req, res) => {
  const { email, pass, confirmPass } = req.body;

  if (!email || !pass || !confirmPass) {
    return res.send('<script>alert("All fields are required"); window.history.back();</script>');
  }

  if (pass !== confirmPass) {
    return res.send('<script>alert("Password and Confirm Password must be same"); window.history.back();</script>');
  }

  try {
    const adminn = await adminMong.findOne({ email });

    if (!adminn) {
      return res.send('<script>alert("User not found"); window.history.back();</script>');
    } else {
      adminn.pass = pass;
      await adminn.save();

        //   return res.send("Password Updated Successfully");
        return res.render('adminLogin',{ siteKey: process.env.RECAPTCHA_SITE_KEY });
    }
  } catch (err) {
    return res.send(
      "there is an error in changing the password please try again later"
    );
  }
});






// -------------------------------- change password route dashboard

router.get('/update-password', (req, res) => {

    if (!req.session.adminEmail) {
        res.render('adminLogin');
    } else {

        res.render('UpdatePassword');
    }
})

router.post('/update-password', async (req, res) => {
    const { password, npassword, cnpassword } = req.body;

    if (!password || !npassword || !cnpassword) {
        return res.send('<script>alert("Please enter password")</script>');
    } 

    if (npassword !== cnpassword) {
        return res.send('<script>alert("Password and confirm password must be same")</script>');
    }

    const  email  = req.session.adminEmail;
    if (!email) {
        res.render('adminLogin');
    }


    try {
        const adminn = await adminMong.findOne({ pass:password });

        if (!adminn) {
            return res.send('<script>alert("Current password is wrong")</script>');
        } else {
            adminn.pass = npassword;
            await adminn.save();
            return res.send('<script>alert("Password changed successfully")</script>');
        }

    } catch (err) {
        return res.send(err.message);
    }

})

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
        fileSize: 5 * 1024 * 1024,
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
        fileSize: 5 * 1024 * 1024,
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
       return res.render('adminLogin');
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
        res.render('adminLogin');
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

router.post('/user-details',async (req,res) => {
    try {
        const { name, email, subject, message } = req.body;

        const exist = await userMong.findOne({ email });

        if (exist) {
            return res.status(409).json({ message: 'user already registerd' });
            
        }

        const newUser = new userMong({
            name, email, subject, message
        })

        await newUser.save();
        await sendMailtoAdmin({ name, email, subject, message });
        return res.status(201).json({message:'User registerd successfull'});

    }
    catch (err) {
        return res.status(500).json({message:err.message});
    }
})

// ---------------------------- manage users

router.get('/manage-user', async(req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin');
    }

    try {
        const userr = await userMong.find();

        res.render('userInfo', { userr });
    }
    catch (err) {
        res.send('error occured');
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
        fileSize: 5 * 1024 * 1024,
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


// --------------------------- sign out

router.get('/signout', (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).send('Unable to log out');
            }
            res.redirect('/admin/login'); // Redirect to login page after logout
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Something went wrong');
    }
});


module.exports = router;