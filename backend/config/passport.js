//config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import { generateUserId } from "../utils/generateId.js";

export default function setupGooglePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,  // наприклад, "/api/auth/google/callback"
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google profile has no email"), null);
          }

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            // Якщо не знайшли за googleId, перевіряємо за email
            user = await User.findOne({ email });
            if (user) {
              // Прив’язуємо Google ID до існуючого облікового запису
              user.googleId = profile.id;
              user.isEmailVerified = true;
              await user.save();
            } else {
              // Створюємо нового користувача
              user = await User.create({
                userId: await generateUserId(),
                name: profile.displayName || "",
                email,
                isEmailVerified: true,
                googleId: profile.id,
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Не обов’язково серіалізувати/десеріалізувати, якщо ти не використовуєш сессії Passport
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}
