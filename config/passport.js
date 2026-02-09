import passport from "passport";
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import User from "../model/User.js"


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
    async (accessToken,refreshToken, profile, done) => {
        try {
            const user = await User.findOne({email: profile.emails[0].value})
            if(!user) {

                const user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                })

            }
            return done(null, user);
        } catch(error) {
            return done(error, null);
        }
    }

))

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});