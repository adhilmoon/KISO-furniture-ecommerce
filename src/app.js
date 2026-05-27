import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import helmet from 'helmet';
import { mongoSanitizeMiddleware } from './middleware/mongoSanitize.js';
import adminRoute from "./routes/admin.js"
import userRoute from "./routes/user.js"
import indexRoutes from "./routes/indexRoutes.js"
import { pageNotFound, globalErrorHandler } from "./middleware/error.middleware.js";
import {fileURLToPath} from 'url';
import path from 'path';
import connectDB from './config/connectDB.js';
import './config/passport.js'
import passport from 'passport';
import { fetchGlobalCategories } from './middleware/globalCategories.js';
import { injectUserBadges } from './middleware/userBadges.js';
import { setUser } from './middleware/userAuth.js';
import logger from './utilities/logger.js';


const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD) app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

await connectDB()

// Security headers (relaxed CSP/COEP — many inline scripts + CDN assets in EJS views).
// COOP is set to 'same-origin-allow-popups' (not the default 'same-origin') and
// CORP is disabled so the Razorpay Checkout popup/netbanking redirect window is
// not severed from its opener — the default same-origin COOP blanks that flow.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false,
}));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Strip MongoDB operator characters ($, .) from req.body / req.params.
// (req.query is getter-only in Express 5, so it's deep-frozen at the framework level.)
app.use(mongoSanitizeMiddleware());

const sessionBase = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE),
        secure: IS_PROD,
        httpOnly: true,
        sameSite: 'lax',
    }
};


const adminSession = session({ ...sessionBase, name: 'admin.sid' });


const userSession = session({ ...sessionBase, name: 'connect.sid' });


app.use('/admin', adminSession);


app.use('/user', userSession);
app.use('/', userSession);


app.use(setUser);
app.use(injectUserBadges);

app.use('/user', passport.initialize());
app.use('/user', passport.session());

app.use(fetchGlobalCategories);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/user');

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/', indexRoutes);

app.use(pageNotFound);
app.use(globalErrorHandler);

const port = process.env.PORT || 4004;
app.listen(port, () => {
    logger.info(`Server started at ${process.env.BASE_URL} `);
});
