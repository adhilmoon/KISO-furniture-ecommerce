import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import adminRoute from "./routes/admin.js"
import userRoute from "./routes/user.js"

const app = express();
const port = 3000;

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false
    }
}));

app.set('view engine', 'ejs');
app.set('views', './views'); 

app.use(expressLayouts);
app.set('layout', 'layouts/user'); 

app.use(express.static("public"));

app.use('/admin',adminRoute)
app.use('/user',userRoute)

// ✅ Use express layout middleware





app.get('/', (req, res) => {
    res.render('user/homepage', {title:'home page', products: [], rooms: [] });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
