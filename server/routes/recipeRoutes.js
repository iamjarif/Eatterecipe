const express = require('express')
const recipeRouter = express.Router()
const recipeController = require('../controllers/recipeController')

const verifyLogin = (req,res,next)=>{
    if(req.session.userLoggedIn){
      next();
    }
    else{
      res.redirect('/signin')
    }
  }

recipeRouter.get('/',recipeController.homepage)

recipeRouter.get('/recipe/:id',recipeController.exploreRecipes)

recipeRouter.get('/submit-recipe',verifyLogin,recipeController.submitRecipe)
recipeRouter.post('/submit-recipe',verifyLogin,recipeController.submitRecipePost)

recipeRouter.post('/signup',recipeController.signupPost)
recipeRouter.get('/signup',recipeController.signUp)

recipeRouter.get('/signin',recipeController.signIn)
recipeRouter.post('/signin',recipeController.signinPost)

recipeRouter.get('/allrecipes',recipeController.allRecipes)

recipeRouter.get('/profile',verifyLogin,recipeController.userProfile)

recipeRouter.get('/editList/:id',verifyLogin,(req,res)=>res.redirect('/profile'))
recipeRouter.post('/editList/:id',verifyLogin,recipeController.editRecipes)

recipeRouter.delete('/deleteList/:id',verifyLogin,recipeController.deleteRecipe)


recipeRouter.get('/logout',(req,res)=> {
  req.session.destroy();
  res.redirect('/');
})

module.exports = recipeRouter
