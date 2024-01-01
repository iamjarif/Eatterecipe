const Recipe = require("../models/Recipe");
const User = require('../models/User');
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const nodemailer = require('nodemailer');
const crypto = require('crypto');

//home
exports.homepage = async (req, res) => {

    try {
        let userId = await req.session.userId;
        let userName = await req.session.username;

        const limitNumber = 5;
        const latest = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber)

        const food = { latest }
        res.render('index', { food, userId, userName })
    }
    catch (error) {
        res.status(500).send({ message: error.message || "Error Occured" })
    }

}

//get a recipe
exports.exploreRecipes = async (req, res) => {
    try {
        let recipeId = req.params.id
        const recipe = await Recipe.findById(recipeId)
        res.render('recipe', { recipe })
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

//view all recipes
exports.allRecipes = async(req,res)=>{
    try {
    
        const recipes = await Recipe.find({})

        res.render('allrecipes', { recipes })
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}


exports.submitRecipe = async (req, res) => {
    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('submit-recipe', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports.submitRecipePost = async (req, res) => {
    try {

        let imageUploadFile;
        let uploadPath;
        let newImageName;

        if (!req.files || Object.keys(req.files).length === 0) {
            console.log('No Files where uploaded.');
        } else {

            imageUploadFile = req.files.image;
            newImageName = Date.now() + imageUploadFile.name;

            uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;

            imageUploadFile.mv(uploadPath, function (err) {
                if (err) return res.satus(500).send(err);
            })
        }
        const newRecipe = new Recipe({
            name: req.body.name,
            description: req.body.description,
            instructions: req.body.instructions,
            ingredients: req.body.ingredients,
            category: req.body.category,
            image: newImageName,
            user:req.session.userId
        });

        await newRecipe.save();

        req.flash('infoSubmit', 'Recipe has been added.')
        res.redirect('/submit-recipe');
    } catch (error) {
        req.flash('infoErrors', error);
        res.redirect('/submit-recipe');
    }
}


exports.signupPost = async (req, res) => {


    User.findOne({ email: req.body.email }).exec(async (error, user) => {
        if (user) {
            req.flash('infoErrors', "User already registered");
        }
        const { name, email, password } = req.body;
        const hash_password = await bcrypt.hash(password, 10);
        const _user = new User({
            name,
            email,
            hash_password: hash_password
        })
        await _user.save();

        req.flash('infoSubmit', 'Registered Successfully')
        res.redirect('/signin')
    })
}

exports.signUp = async (req, res) => {

    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('signup', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports.signIn = async (req, res) => {

    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('signin', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports.signinPost = async (req, res) => {
    try {

        if (req.user && req.user.googleId) {

            req.session.userId = req.user._id;
            req.session.username = req.user.name;
            req.session.userLoggedIn = true;
            return res.redirect('/');
        }


        await User.findOne({ email: req.body.email }).exec(async (error, user) => {
            if (error) {
                req.flash('infoErrors', error);
                return res.redirect('/signin');
            }

            if (user) {
                const isPassword = await user.authenticate(req.body.password);
                if (isPassword) {
                    req.session.userId = user._id;
                    req.session.username = user.name;
                    req.session.userLoggedIn = true;
                    return res.redirect('/');
                } else {
                    req.flash('infoErrors', 'Email/Password is incorrect');
                    return res.redirect('/signin');
                }
            } else {
                req.flash('infoErrors', 'User does not exist');
                return res.redirect('/signin');
            }
        });
    } catch (error) {
        req.flash('infoErrors', error);
        res.redirect('/signin');
    }
};


exports.userProfile = (req,res) =>{
    try {
        let count = 0
        User.findOne({ _id: req.session.userId }).exec(async (error, user) => {
            if (error) console.log(error);
            if (user) {
                let recipe = await Recipe.find({ user: ObjectId(user._id) })
                if (recipe) {
                    count = recipe.length     
                }
                res.render('userProfile',{ user,count,recipe })
                
            } else {
                console.log(error);
            }
        });
    }
    catch (error) {
        console.log(error)
        req.flash('infoErrors', error);
    }
    
}

exports.editRecipes = async(req,res)=>{
        const recipe_id = req.params.id
        const recipeItem = await Recipe.find({ _id: ObjectId(recipe_id) })
        let ingredientsArray;
        let imageUploadFile;
        let uploadPath;
        let newImageName;

        if (!req.files || Object.keys(req.files).length === 0) {
            console.log('No Files where uploaded.');
        } 
        else {
            imageUploadFile = req.files.image;
            newImageName = Date.now() + imageUploadFile.name;

            uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;

            imageUploadFile.mv(uploadPath, function (err) {
                if (err) return res.satus(500).send(err);
            })
        }

        if(req.body.ingredients){
            ingredientsArray = req.body.ingredients.split(',');
        }
        console.log(ingredientsArray)

        await Recipe.findByIdAndUpdate({_id: ObjectId(recipe_id)},

                   { name: req.body.name ? req.body.name : recipeItem[0].name,
                    description: req.body.description ? req.body.description : recipeItem[0].description,
                    instructions: req.body.instructions ? req.body.instructions : recipeItem[0].instructions,
                    ingredients: req.body.ingredients ? ingredientsArray : recipeItem[0].ingredients,
                    category: req.body.category ? req.body.category : recipeItem[0].category,
                    image: newImageName ? newImageName : recipeItem[0].image,
                },
                { new: true }

                )
        res.redirect('/profile')
       
}

exports.deleteRecipe = async(req,res)=>{
    let id = req.params.id

    await Recipe.deleteOne({ _id: ObjectId(id) })
    .then((response)=>{

       res.json({status:true})
    })

}



//reset pass
const sendResetPasswordEmail = async (userEmail, resetToken) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'penelope15@ethereal.email',
            pass: 'dfWYh4hr7PZBHySgr4'
        }
    });
  
    const mailOptions = {
      from: 'penelope15@ethereal.email',
      to: userEmail,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n`
        + `Here is the token:\n\n`
        + `${resetToken}\n\n`
        + `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
  
    await transporter.sendMail(mailOptions);
  };
  
  exports.renderForgotPasswordPage = (req, res) => {
    res.render('forgot-password');
  };
  
  let userEmail = '';

  exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      userEmail = email; 
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.render('forgot-password', { message: 'Email not found' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; 
      await user.save();
  
      await sendResetPasswordEmail(email, token); 
  
      res.render('reset-token', { token });
    } catch (error) {
      res.status(500).send({ message: error.message || 'Error Occurred' });
    }
  };

  exports.validateResetToken = async (req, res) => {
    try {
      const { token } = req.body;
  
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (user) {

        return res.render('reset-password', { token });
      } else {
        return res.render('reset-token', { message: 'Invalid or expired token or token does not exist' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({ message: error.message || 'Error Occurred' });
    }
  };
  
  exports.resetPassword = async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
      const email = userEmail; 
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.render('reset-password', { message: 'Invalid email' });
      }
  
      if (newPassword !== confirmPassword) {
        return res.render('reset-password', { message: 'Passwords do not match' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      user.hash_password = hashedPassword;
      await user.save();
  

      userEmail = ''; 
      return res.redirect('/signin');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({ message: error.message || 'Error Occurred' });
    }
  };
  
  

  exports.renderResetTokenPage = (req, res) => {
    res.render('reset-token');
  };
  
  
  exports.renderResetPasswordPage = (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token });
  };
  
  