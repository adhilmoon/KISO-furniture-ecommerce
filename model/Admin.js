import mongoose, {Schema}  from "mongoose";

const adminScheama= new Schema({
    email:{
        type: String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})
const Admin= mongoose.model('Admin',adminScheama)
export default Admin