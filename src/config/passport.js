import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../model/User.js";
import logger from "../utilities/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || process.env.CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google email not found"), null);
        }

        // Find existing user
        let user = await User.findOne({ email });

        // If user exists but blocked
        if (user && user.isBlocked) {
          return done(null, false, {
            message: "Your account has been blocked",
          });
        }

        // Create new user if not exists
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            role: "user",
            isBlocked: false,
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Google OAuth Error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error(`Deserialize User Error: ${error.message}`);
    done(error, null);
  }
});
