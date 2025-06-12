const scheduleMong = require('../models/Schedule_Mong');

exports.postSchedule=async (req,res) => {
    
    const { date, time, name, email, mobile, city } = req.body;

    try {
        const newSchedule = new scheduleMong({
            date, time, name, email, mobile, city
        })

        await newSchedule.save();
        return res.status(200).json({ message: 'Appointment Scheduled' });


    }

    catch (err) {
        return res.status(400).json({ message: 'Server Error' });
    }


}

exports.getmanageSchedule=async (req,res) => {
    
    if (!req.session.adminEmail) {
        res.render('adminLogin', { siteKey: process.env.RECAPTCHA_SITE_KEY });
    } else {

        try {
                    const schedule = await scheduleMong.find();
        
                    res.render('manageSchedule', { schedule });
                }
                catch (err) {
                    console.log(err);
                }
        
    }

}


exports.deleteSchedule=async (req,res) => {
    
     try {
            await scheduleMong.findByIdAndDelete(req.params.id);
            return res.redirect('/admin/manage-schedule');
        } catch (err) {
            return res.send('cannot delete at this time');
        }

}