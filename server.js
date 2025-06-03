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
const cors = require('cors');
dotenv.config();
app.set("views", path.join(__dirname, "views"));

// ------------------------------- middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -------------------------------- cors

app.use(cors({
  origin: process.env.REACT_APP_API_URL,
  credentials: true,
}))


// -------------------------------- session for live

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

// -------------------------------- session for localhost

app.use(
    session({
      secret: "hitesh2822", 
      resave: false,
      saveUninitialized: true,
      cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
      }, 
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