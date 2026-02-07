import dotenv from 'dotenv'
dotenv.config()

import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts'; 
import adminRoute from "./routes/admin.js"
import userRoute from "./routes/user.js"
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/connectDB.js'
import './config/passport.js'
import passport from 'passport'; 


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

connectDB()


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false
    }
}));

app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'ejs');
app.set('views', './views'); 

app.use(expressLayouts);
app.set('layout', 'layouts/user'); 

app.use(express.static("public"));

app.use('/admin', adminRoute)
app.use('/user', userRoute)

app.get('/', (req, res) => {
    res.render('user/homepage', { title: 'home page', products: [], rooms: [] , user: req.session.user || req.user || null});
});

const port = process.env.PORT || 4004;
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});