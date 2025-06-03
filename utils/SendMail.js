const nodemailer = require('nodemailer');

const sendMailtoAdmin=async (userData) => {
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: 'hs706507@gmail.com',
        to: 'hitesh@nexadvent.com',
        subject: 'New registered User',
        html: `
        <h3>New User Registered</h3>
      <p><strong>Name:</strong> ${userData.name}</p>
      <p><strong>Email:</strong> ${userData.email}</p>
      <p><strong>Subject:</strong> ${userData.subject}</p>
      <p><strong>Message:</strong> ${userData.message}</p>`
    };

    await transporter.sendMail(mailOptions);

}

module.exports = sendMailtoAdmin;