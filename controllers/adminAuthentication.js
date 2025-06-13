const adminMong = require('../models/Admin_Mong');
const sendOtptoAdmin = require('../utils/sendotp');
const forgetPasswordOtp = require('../utils/forgetotp');
const bcrypt = require('bcrypt');
const axios = require('axios');


// ------------------------- adminsignup

exports.postadminSignup = async(req, res) => {
    
    const { name, email, mobile, pass } = req.body;
    
    try {
        const exist = await adminMong.findOne({ email });

        if (exist) {
            return res.send('<script>alert("Admin with this email already exist"); window.history.back();</script>');
        }

        const hashedPass = await bcrypt.hash(pass, 10);

        const newAdmin = new adminMong({
            name, email, mobile, pass: hashedPass
            
        })

        await newAdmin.save();
        return res.send('<script>alert("Admin registered successfull"); window.history.back();</script>');

    }

    catch (err) {
        return res.send('<script>alert("error"); window.history.back();</script>');
    }


}

// ------------------------- adminlogin

exports.getadminLogin = (req, res) => {
    
res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });

}

exports.postadminLogin=async (req,res) => {
    
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

        const match = await bcrypt.compare(pass, admin.pass);

        if (match) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            req.session.otp = otp;
            req.session.tempAdmin = { email: admin.email, name: admin.name };

            await sendOtptoAdmin(admin.email, otp);

            return res.redirect('/admin/verify-otp');
        } else {
            return res.send('<script>alert("Incorrect Password")</script>');
        }
    } catch (err) {
        console.error(err);
        return res.send('<script>alert("Error occurred, please try again later")</script>');
    }
}

// ----------------------------- verify otp

exports.getVerifyOtp = (req, res) => {
    
    if (!req.session.tempAdmin) return res.redirect('/admin/login');

    res.render('otpVerify'); // EJS form to enter OTP
};

exports.postVerifyOtp=async (req,res) => {
    
     const { enteredOtp } = req.body;

    try {
        if (parseInt(enteredOtp) === req.session.otp) {
        req.session.adminEmail = req.session.tempAdmin;

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

}

exports.postResendOtp = async(req, res) =>{
    
    if (!req.session.tempAdmin) {
    return res.redirect('/admin/login');
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = otp;

    // Send OTP to admin's email
    await sendOtptoAdmin(req.session.tempAdmin.email, otp);

    return res.send('<script>alert("OTP resent successfully"); window.location="/admin/verify-otp";</script>');
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    return res.send('<script>alert("Failed to resend OTP"); window.location="/admin/verify-otp";</script>');
  }

}

// --------------------- get dashboard

exports.getadminDashboard = (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
    } else {
        const { email,name } = req.session.adminEmail;
        res.render('adminDash', { email, name });
    }
}

// --------------------- forget password otp

exports.postforgetPassword = async (req, res) => {
    
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
    
    res.render('forgetPassOtp', { email });
    
        }
        catch (err) {
            res.send('err');
        }

}

// ---------------------- post verify otp forget password

exports.postverifyforgetPassword=async (req,res) => {
    
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

}

// ----------------------------- resend forget otp

exports.postresendForgetotp=async (req,res) => {
    
    const { email } = req.body;
    
      const admin = await adminMong.findOne({ email });
    
      if (!admin) {
        return res.send('<script>alert("Admin not found"); window.history.back();</script>');
      }
    
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 5 * 60 * 1000;
    
      admin.otp = otp;
      admin.otpExpires = otpExpires;
      await admin.save();
    
      await forgetPasswordOtp(email, otp); // same mailer function
    
      res.render('forgetPassOtp', { email }); // re-render OTP form again

}

// --------------------- update forget password

exports.getupdateforgetpassword=async (req,res) => {
    
    const { email } = req.query;

    if (!email) {
        return res.send('<script>alert("Email is required"); window.history.back();</script>');
    }
    return res.render('updatePass',{email});

}

exports.postupdateforgetPassword=async (req,res) => {
    
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
      } 
      
       // Hash the new password
    const hashedPassword = await bcrypt.hash(pass, 10);
    adminn.pass = hashedPassword;
    await adminn.save();      
      return res.render('adminLogin',{ siteKey: process.env.RECAPTCHA_SITE_KEY });
  } catch (err) {
    // return res.send(
    //   "there is an error in changing the password please try again later"
      // );
      
      return res.send(err.message);
  }

}

// ---------------------------  change password route dashboard

exports.getdashPass = (req, res) => {
    if (!req.session.adminEmail) {
        res.render('adminLogin',{ siteKey: process.env.RECAPTCHA_SITE_KEY });
    } else {

        res.render('UpdatePassword');
    }
}

exports.postdashPass=async (req,res) => {
    
    const { password, npassword, cnpassword } = req.body;

    if (!password || !npassword || !cnpassword) {
        return res.send('<script>alert("Please enter password")</script>');
    } 

    if (npassword !== cnpassword) {
        return res.send('<script>alert("Password and confirm password must be same")</script>');
    }

    const  email  = req.session.adminEmail;
    if (!email) {
        return res.render('adminLogin',{ siteKey: process.env.RECAPTCHA_SITE_KEY });
    }


    try {
        const adminn = await adminMong.findOne({ email: email.email });

        if (!adminn) {
            return res.send('<script>alert("Current password is wrong")</script>');
        } 

         const isMatch = await bcrypt.compare(password, adminn.pass);
        if (!isMatch) {
            return res.send('<script>alert("Current password is incorrect")</script>');
        }

        const hashedNewPass = await bcrypt.hash(npassword, 10);
        adminn.pass = hashedNewPass;
        await adminn.save();
        return res.send('<script>alert("Password Changed")</script>');

    } catch (err) {
        return res.send(err.message);
    }

}

exports.adminLogout= (req,res) => {
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
}