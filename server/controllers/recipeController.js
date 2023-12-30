const Category = require("../models/Category")
const Recipe = require("../models/Recipe");
const User = require('../models/User');
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

//home
exports = module.exports.homepage = async (req, res) => {

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
exports = module.exports.exploreRecipes = async (req, res) => {
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
module.exports.allRecipes = async(req,res)=>{
    try {
    
        const recipes = await Recipe.find({})

        res.render('allrecipes', { recipes })
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}


exports = module.exports.submitRecipe = async (req, res) => {
    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('submit-recipe', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports = module.exports.submitRecipePost = async (req, res) => {
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


exports = module.exports.signupPost = async (req, res) => {


    User.findOne({ email: req.body.email }).exec(async (error, user) => {
        if (user) {
            req.flash('infoErrors', "User already registered");
        }
        const { name, email, password,description } = req.body;
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

exports = module.exports.signUp = async (req, res) => {

    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('signup', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports = module.exports.signIn = async (req, res) => {

    try {
        const infoErrorsObj = req.flash('infoErrors');
        const infoSubmitObj = req.flash('infoSubmit');
        res.render('signin', { infoErrorsObj, infoSubmitObj });
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Error Occured" })
    }
}

exports = module.exports.signinPost = async(req, res) => {
    try {

       await User.findOne({ email: req.body.email }).exec(async (error, user) => {
            if (error) req.flash('infoErrors', error);
            if (user) {
                const isPassword = await user.authenticate(req.body.password);
                if (isPassword) {
                    req.session.userId = user._id
                    req.session.username = user.name
                    req.session.userLoggedIn = true
                    res.redirect('/')
                }
                else {
                    console.log("Email/Password is incorrect")
                    req.flash('infoErrors', "Email/Password is incorrect")
                }
            } else {
            
                req.flash('infoErrors', "Not existing user")
                res.redirect('/signin');
            }
        });
    }
    catch (error) {
        req.flash('infoErrors', error);
        res.redirect('/signin');
    }
}


module.exports.userProfile = (req,res) =>{
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

module.exports.editRecipes = async(req,res)=>{
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

module.exports.deleteRecipe = async(req,res)=>{
    let id = req.params.id

    await Recipe.deleteOne({ _id: ObjectId(id) })
    .then((response)=>{

       res.json({status:true})
    })

}
