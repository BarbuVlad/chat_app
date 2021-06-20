/*Middleware authorization: 
Verify the existence of a jwt in the header of the HTTP request*/
const jwt = require('jsonwebtoken');
require('dotenv/config'); 

const authorization = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({message:"Access denied. No token", code:-10});

    try{
        const valid =  jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        req.user = valid;
        next();///<valid token, pass to other middleware
    } catch(err){
        res.status(401).json({message:"Access denied. Bad token", code:-11});
    }
    
} 

module.exports = {
    authorization
};