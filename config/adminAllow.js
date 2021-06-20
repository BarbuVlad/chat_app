/*Middleware authorization for admin actions: 
Verify the admin value of the request, so:
IMPORTANT: must be applied after the authorization middleware

*/
const jwt = require('jsonwebtoken');
require('dotenv/config'); 

const adminAllow = (req, res, next) => {
    if(!req.user.isAdmin){
        return res.status(403).json({message:"Access denied!", code:-12});
    }
    next();
} 

module.exports = {
    adminAllow
};