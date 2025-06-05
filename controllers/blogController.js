const blogMong = require('../models/Blog_Mong');
const path = require('path');

// ------------------------------- get add blog page

exports.getaddBlogPage = (req, res) => {
    
if (!req.session.adminEmail) {
        res.render('adminLogin');
    } else {

        res.render('AddBlogs');
    }

}

// ------------------------------- post add blog page

exports.postaddBlogPage = async(req, res) => {
    
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

}

// -------------------------------- manage blog

exports.manageBlogPage = async (req, res) => {

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

    
}

// --------------------------------- manage blogapi (json)

exports.manageBlogPageapi = async (req, res) => {
    
    try {
            const blog = await blogMong.find();

            // res.render('manageBlogs', { blog });
            res.json(blog);
    }   
     catch (err) {
         console.log(err);
    }

}

// -------------------------------- edit blog

exports.editBlogPage=async (req,res) => {
    
    try {
            const editblog = await blogMong.findById(req.params.id);
    
            res.render('editBlog', { editblog });
        }
        catch (err) {
            console.log(err);
        }

}

// ------------------------------- update blogs

exports.updateBlogs=async (req,res) => {
    
     try {
        const { title,desc} = req.body;
    
        await blogMong.findByIdAndUpdate(req.params.id, {
          title,desc
        });
    
        res.redirect("/admin/manage-blog");
      } catch (err) {
        res.send("cannot be edited at this time");
      }

}

// ------------------------------- delete blogs

exports.deleteBlogs=async (req,res) => {
    
     try {
            await blogMong.findByIdAndDelete(req.params.id);
            return res.redirect('/admin/manage-blog');
        } catch (err) {
            return res.send('cannot delete at this time');
        }

}

// --------------------------------- get edit image

exports.getEditImage=async (req,res) => {
    
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

}

// --------------------------------- post edit image

exports.postEditImage = async (req, res) => {
    
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

// ----------------------- delete image

exports.deleteImage=async (req,res) => {
    
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

}