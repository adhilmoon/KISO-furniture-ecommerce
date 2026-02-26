import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts'; 
import adminRoute from "./routes/admin.js"
import userRoute from "./routes/user.js"
import * as userPages from "./controller/usercontroller/pages.js";
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/connectDB.js';
import './config/passport.js'
import passport from 'passport'; 
import User from './model/User.js';


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

await connectDB()


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false
    }
}));
app.use(async(req,res,next)=>{
    try {
        if(req.session.user){
            const user=await User.findById(req.session.user._id)
            res.locals.user=user||null
        }else{
            res.locals.user=null
        }
        next()
    } catch (error) {
         console.log('global user middilware error',error)
         res.locals.user=null
         next()
    }
})
app.use(passport.initialize())
app.use(passport.session())


app.set('view engine', 'ejs');
app.set('views', './views'); 

app.use(expressLayouts);
app.set('layout', 'layouts/user'); 

app.use(express.static("public"));

app.use('/admin', adminRoute)
app.use('/user', userRoute)

app.get('/', userPages.user_home);

const port = process.env.PORT || 4004;
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});