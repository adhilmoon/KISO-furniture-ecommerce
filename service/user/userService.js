import User from '../../model/User.js';
import bcrypt from 'bcrypt'

export const createUser=async(userData)=>{
    const{name,email,password}=userData;
    const hashedPassword=await bcrypt.hash(password,12)

    const newUser= new User({
        name,
        email,
        password:hashedPassword,
    })

    return await newUser.save();
    
}

// export const usermanagement=async(){
//     page=parseInt(req.query.page)||1;
//     perPage=10;
//     skip=(page-1)*perPage
//     totalUsers= User.countDocuments()
//     const users=User.find
// }