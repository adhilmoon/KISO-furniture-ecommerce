export const userauth = (req, res, next) => {
   
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/user/login');
    }
};
 export const islogin = (req, res, next) => {
    try {
        if(req.session.user) {
            return res.redirect('/user/homepage')
        }
        next()
    } catch(error) {
         console.log("something rowng in login",error)
    }

}
export const isUser=(req,res,next)=>{
     try {
       if(!req.session.user.role==="user"){
          return res.redirect('user/login')
       }
       next()
       
     } catch (error) {
        console.log("user chekking midilware error");
     }
}

export const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};