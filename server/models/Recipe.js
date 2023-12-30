const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types 

const recipeSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    instructions:{
        type:String,
        required:true
    },
    ingredients:{
        type:Array,
        required:true
    },
    category:{
        type:String,
        enum:['Thai','American','Chineese','Indian','Mexican','Italian'],
        required:true
    },
    image:{
        type:String,
        required:true
    },
    user:{
        type:ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true})
recipeSchema.index({name:'text',description:'text'})


module.exports = mongoose.model('Recipe',recipeSchema)