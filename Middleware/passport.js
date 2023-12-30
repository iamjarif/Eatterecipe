const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../server/models/User');


passport.use(
  new GoogleStrategy(
    {
      clientID: "196100731666-gn0chh0atp47firnhkee6macm2fc3gp1.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: 'http://localhost:4001/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {

          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,

          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


module.exports = passport;
