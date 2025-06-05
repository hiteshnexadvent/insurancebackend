const nodemailer = require('nodemailer');

const sendOtptoAdmin=async (email,otp) => {
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }

    })

    const mailOptions = {
      from: 'hs706507@gmail.com',
      to: 'hitesh@nexadvent.com',
      subject: 'Your Admin Login Otp',
      html: `
      <h2>Admin Login OTP</h2>
            <p>Your OTP for admin login is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 5 minutes. Do not share it with anyone.</p>
      `
    }

    await transporter.sendMail(mailOptions);

}

module.exports = sendOtptoAdmin;
