const express = require('express');
const router = express.Router(); 
const adminMong = require('../models/Admin_Mong');
const blogMong = require('../models/Blog_Mong');
const coverimagemong = require('../models/BlogCover.Mong');
const multer = require('multer');
const path = require('path');

router.get('/adminlogin', (req, res) => {
    res.render('adminLogin');
})

router.post('/adminlogin',async (req,res) => {
    
    const { email, pass } = req.body;

    try {
        const admin = await adminMong.findOne({ email });

        if (!admin) {
            return res.send('<script>alert("admin does not exist")</script>');
        }


        if (admin.pass === pass) {
            req.session.adminEmail = { email: admin.email };
            // return res.send('user login successful');
            res.redirect(`/admin/adminDash`);
        }
        else {
            return res.send('<script>alert("Incorrect Password")</script>');
        }

    }
    catch (err) {
         return res.send('<script>alert("error occured while login try again later")</script>');
        
    }

})

router.get('/adminDash', (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin');
    } else {
        const { email } = req.session.adminEmail;
        res.render('adminDash', { email });
    }
})

// -------------------------------- change password

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


router.get('/add-blog', (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin');
    } else {

        res.render('AddBlogs');
    }
})

router.post('/add-blog',upload.array('image',5), async (req, res) => {
    
    const { title, desc } = req.body;

    const imagePath = req.files.map((file) => `/uploads/${file.filename}`);

    try {
        const newBlog = new blogMong({
            title, desc, image: imagePath
        })

        await newBlog.save();
        return res.send('<script>alert("Blog added")</script>');
    }
    catch (err) {
        res.send(err.message);
    }
    
})

// -------------------------------- manage blogs

router.get('/manage-blog',async (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin');
    } else {
        try {
            const blog = await blogMong.find();

            res.render('manageBlogs', { blog });
        }
        catch (err) {
            console.log(err);
        }
    }
})

router.get('/manage-blogapi',async (req, res) => {
     try {
            const blog = await blogMong.find();

            // res.render('manageBlogs', { blog });
            res.json(blog);
    }   
     catch (err) {
         console.log(err);
    }
})

// ---------------------------------- edit blogs

router.get('/edit-blog/:id',async (req,res) => {
    try {
        const editblog = await blogMong.findById(req.params.id);

        res.render('editBlog', { editblog });
    }
    catch (err) {
        console.log(err);
    }
})

// --------------------------------- update blogs

router.post("/edit-blog/:id", async (req, res) => {
  try {
    const { title,desc} = req.body;

    await blogMong.findByIdAndUpdate(req.params.id, {
      title,desc
    });

    res.redirect("/admin/manage-blog");
  } catch (err) {
    res.send("cannot be edited at this time");
  }
});

// --------------------------------------- delete blog

router.get('/delete-blog/:id',async (req,res) => {
    
    try {
        await blogMong.findByIdAndDelete(req.params.id);
        return res.redirect('/admin/manage-blog');
    } catch (err) {
        return res.send('cannot delete at this time');
    }

})

// --------------------------------------- edit image

router.get("/edit-image/:imgid/:imgindex", async (req, res) => {
  try {
    const { imgid, imgindex } = req.params;

    const blogid = await blogMong.findById(imgid);

    if (!blogid) {
      return res.send("Blog not found");
    }

    const blogindex = blogid.image[imgindex];

    if (!blogindex) {
      return res.send("image not found");
    }

    res.render("editblogimage", { blogindex, imgid, imgindex });
  } catch (err) {
    res.send("error occured");
  }
});

router.post(
  "/edit-image/:imgid/:imgindex",
  upload.single("file"),
  async (req, res) => {
    try {
      const { imgid, imgindex } = req.params;
      const file = req.file;

      if (!file) {
        return res.send("no blog found");
      }

      const bl = await blogMong.findById(imgid);

      if (!bl) {
        return res.send("no blog found");
      }

      if (!bl.image[imgindex]) {
        return res.send("no blog image found");
      }

      const newimagepath = `/uploads/${file.filename}`;
      bl.image[imgindex] = newimagepath;

      await bl.save();
          return res.send('<script>alert("Image changed successfull")</script>');
    } catch (err) {
      res.send('check network connection');
    }
  }
);

// ---------------------------------- delete image

router.get('/delete-image/:imgid/:imgindex',async (req,res) => {
    try {
        const { imgid, imgindex } = req.params;

        const deleteimg=await blogMong.findById(imgid);

        if (!deleteimg) {
            return res.send('<script>alert("cannot find blog image")</script>');
        }

        deleteimg.image.splice(imgindex, 1);

        await deleteimg.save();
        // res.redirect('/admin/edit-blog');
        return res.send('<script>alert("image deleted successfully")</script>');
    }
    catch (err) {
        res.send(err.message);
    }
})

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






module.exports = router;