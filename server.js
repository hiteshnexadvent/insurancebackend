const express = require('express');
const app = express();
app.use(express.static('public'));
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
app.set('view engine', 'ejs');
const session = require('express-session');
const router = require('./routes/admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
app.set("views", path.join(__dirname, "views"));

// ------------------------------- middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// -------------------------------- session

// app.use(session({
//     secret: process.env.SECRET_SESSION_KEY,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         sameSite: 'none',
//         secure: true,
//         maxAge: 24 * 60 * 60 * 1000,
//         httpOnly: true,
//     }
// }))

app.use(
    session({
      secret: "hitesh2822", // Replace with a secure, randomly generated key
      resave: false,
      saveUninitialized: true,
      cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
      }, // Set `secure: true` only if using HTTPS
    })
  );


// ------------------------------------ mongoose

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDb Connected'))
    .catch(() => console.log('Error while connecting to server')) 


app.use('/admin', router);

app.get('/', (req, res) => {
    res.render('Index');
})








app.listen(process.env.PORT, () => {
    console.log('Server is started');
})