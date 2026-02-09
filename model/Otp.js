import mongoose from 'mongoose'

const Otpscheama = new mongoose.Schema({
    otp: String,
    otpExpires:Date,
    isVarified:{type:Boolean,default:false}
})

const Otp=mongoose.model('Otp',Otpscheama)
export default Otp