import mongoose, {trusted} from "mongoose";
let schema=mongoose.Schema;

const categoryScheama= new schema({
    categoryName:{
        type:String,
        unique:true,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    isActieve:{
        type:Boolean,
        required:true,
        default:true
    },
    offer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Offer",
        default:null
    }
},{timestamps:true})

export default mongoose.model("Category",categoryScheama)
