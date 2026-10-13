const mongoose=require('mongoose')

const classSchema=new mongoose.Schema({
    className: {
        type: String,
        required:true,
        trim:true
    },
    description: {
        type: String,
        required:true,
        default:"",
        trim:true
    },
    subject: {
        type: String,
        required:true,
        trim:true
    },
     classCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    teacher: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{timestamps:true})
const classModel = mongoose.model("Class", classSchema);
module.exports = classModel;
