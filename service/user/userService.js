
import bcrypt from 'bcrypt'
import * as otpsender from '../../utilities/sendEmail.js';
import  {userRepository} from '../../repository/user/userRepository.js';
import { MESSAGES } from '../../constants/index.js';



export const userService={


    async signup(data,isResend=false){
       const{name,email,password,refferralCode}=data;
       if(isResend){
           const newOtp=Math.floor(1000+Math.random()*9000).toString();
           await otpsender.sendOTP(email,newOtp);
           return {success:true,message:MESSAGES.NEW_OTP_SENT,otp:newOtp};
       } 
       const existingUser=await userRepository.findByEmail(email);
        if(existingUser){
            throw new Error(MESSAGES.USER_ALREADY_EXISTS)
        }
        const otp=Math.floor(1000+Math.random()*9000).toString();
        await otpsender.sendOTP(email,otp);

        return {
            success:true,
            message:MESSAGES.OTP_SENT,
            otp,
            tempData:{name,email,password,refferralCode,otp}
        }
    },

     async verifyOtp(enteredOtp,tempUser,purpose){
        if(!tempUser){
            throw new Error(MESSAGES.SESSION_EXPIRED);
        }
        if(String(tempUser.otp)!==String(enteredOtp)){
            throw new Error(MESSAGES.INVALID_OTP)
        }
        if(purpose==='forgot_password'){
            return {success:true,allowReset:true};
        }
        if(purpose==='update-email'){
            return {success:true};
        }
        const hashedPassword=await bcrypt.hash(tempUser.password,10);
        await userRepository.createUser({
            name:tempUser.name,
            email:tempUser.email,
            password:hashedPassword,
            referralCode:tempUser.referralCode
        })

        return {success:true,message:MESSAGES.USER_REGISTERED_SUCCESS}

    },

    async verifyPassword(password,user){
        const isValid=await bcrypt.compare(password,user.password);
        if(!isValid){
           throw new Error(MESSAGES.INCORRECT_PASSWORD)
        }
        return true ;
    },

    async forgotPassword(email,isResend=false){
        const user= await userRepository.findByEmail(email);
        if(!user)throw new Error(MESSAGES.USER_NOT_FOUND);
         
        const otp = Math.floor(1000+Math.random()*9000).toString();
        await otpsender.sendOTP(email,otp);

        return{
            success:true,
            message:isResend?MESSAGES.NEW_OTP_SENT:MESSAGES.OTP_SENT,
            tempData:{email,otp,purpose:'forgot_password'}
        }
    },
    async updatePassword(email,newPassword){
        const hashedPassword=await bcrypt.hash(newPassword,10);
        await userRepository.updatePassword(email,hashedPassword);
        return {success:true,message:MESSAGES.PASSWORD_UPDATED_SUCCESS};
    },
    async deleteAddress(addressId){
        await userRepository.deleteAddress(addressId);
        return {success:true,message:MESSAGES.ADDRESS_DELETED}
    }

}

