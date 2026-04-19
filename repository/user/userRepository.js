import User from "../../model/User.js";

import Address from "../../model/Address.js";


export const userRepository={
     async findByEmail(email){
        return await User.findOne({email})
     },
     async findById(id){
        return await User.findById(id)
     },
     async createUser(data){
        return await User.create(data)
     },
     async updateUser(id,updateData){
        return await User.findByIdAndUpdate(id,updateData,{new:true});
     },
     async updatePassword(email,hashedPassword){
        return await User.findOneAndUpdate(
              {email},
              {password:hashedPassword}
        );
    
     },
     async deleteAddress(addressId){
        return await Address.findByIdAndDelete(addressId)
     }

}