const mongoose=require('mongoose')

const lessonSchema=new mongoose.Schema({
    title:{
        type:String,
        require:true,
        trim:true,
        minlength:5,
        maxlength:150
    },
    description:{
        type:String,
        default:"",
        minlength:10,
        maxlength:2000
    },
    
})