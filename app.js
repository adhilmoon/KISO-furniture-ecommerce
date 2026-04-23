import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import adminRoute from "./routes/admin.js"
import userRoute from "./routes/user.js"
import indexRoutes from "./routes/indexRoutes.js"
import { pageNotFound, globalErrorHandler } from "./middleware/errror.middleware.js";
import {fileURLToPath} from 'url';
import path from 'path';
import connectDB from './config/connectDB.js';
import './config/passport.js'
import passport from 'passport';
import { fetchGlobalCategories } from './middleware/globalCategories.js';
import { setUser } from './middleware/userAuth.js';
import logger from './utilities/logger.js';


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

await connectDB()

app.use(express.urlencoded({extended: true}));
app.use(express.json());


const sessionBase = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE),
        secure: false,
        httpOnly: true,
    }
};


const adminSession = session({ ...sessionBase, name: 'admin.sid' });


const userSession = session({ ...sessionBase, name: 'connect.sid' });


app.use('/admin', adminSession);


app.use('/user', userSession);
app.use('/', userSession);


app.use(setUser);

app.use('/user', passport.initialize());
app.use('/user', passport.session());

app.use(fetchGlobalCategories);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/user');

app.use(express.static("public"));

app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/', indexRoutes);

app.use(pageNotFound);
app.use(globalErrorHandler);

const port = process.env.PORT || 4004;
app.listen(port, () => {
    logger.info(`Server started at http://localhost:${port}`);
});