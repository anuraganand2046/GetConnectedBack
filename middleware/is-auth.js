const jwt= require('jsonwebtoken');
module.exports= (req, res, next)=>{
    const authHeader= req.get('Authorization');
    if(!authHeader){
        const error= new Error('Not authorized');
        error.statusCode=401;
        throw error;
    }
    const token= authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken= jwt.verify(token, 'somesecret');//secret has to be same as u provided at the frontend .
    }catch(err){
        err.statusCode=500;
        throw err;
    }
    //decodeToken now is bool which is true if the user was authenticated otherwise false.
    if(!decodedToken){
        const error= new Error('Not Authenticated');
        error.statusCode=401;
        throw error;
    }
    //Finally the token was correct.So we find the user id from this token and give this user id every right to be logged in.
    req.userId= decodedToken.userId;//hence the req will now get access to all the properties.
    next();//This ensures that checking the authentication of the user is just a part of the process.
}