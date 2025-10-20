//config/passport.js
import User from "../models/user";
import {generateUserId} from "../utils/generateId";

const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (passport) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://apartica-app-2tbz.onrender.com/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            userId: await generateUserId(),
            name: profile.displayName,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            phoneNumber: '',
            isEmailVerified: true,
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value || ''
          });
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
};