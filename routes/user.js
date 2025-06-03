const express = require('express');
const router1 = express.Router(); 
const userMong = require('../models/UserQuery_Mong');
const sendMailtoAdmin = require('../utils/SendMail');


// ----------------------------------- contact form

router1.post('/user-details',async (req,res) => {
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

router1.get('/manage-user',())





module.exports = router1;