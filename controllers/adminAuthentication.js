const adminMong = require('../models/Admin_Mong');

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