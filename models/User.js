const mongoose = require('mongoose');
const Joi = require('joi'); //returns a class
const jwt = require('jsonwebtoken');
require('dotenv/config'); 

// Create a schema for user (to describe the data structure)
const userSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
        maxlength: 255,
        lowercase: true,
        trim: true
        //enum: ['a', 'b', 'c']
    },

    password: {
        type: String,
        minlength: 5,
        //required: true
      //  required: true
    },
    
    contacts: {
        type: [ {type:Map, of: String} ], //.map = new Map([['key', 'value']]); key is other user ID, value is conversation ID 
        default: []
    },
    pending_contacts: {
        type:[ {type:Map, of: String} ],  //.map = new Map([['key', 'value']]); key is other user ID, value is conversation ID 
        default: []
    },
    invites:{
      type:[ {type:Map, of: String} ],  //.map = new Map([['key', 'value']]); key is other user ID, value is conversation ID 
      default: []
    },

    blocked: {
        type: Boolean,
        default: false
    },

    isAdmin:{
      type:Boolean,
      default:false
    }///<to be included in jwt payload
});//schema
//Schema methods:
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({_id: this._id, isAdmin: this.isAdmin}, process.env.JWT_PRIVATE_KEY);
    return token;
}

const User = mongoose.model('users',userSchema);//model

function validateUserData(user){
    /*Validates user parameter; in JS object format {...}

      *The function returns the error message or
      null if no error was found
      For the parameter pass the actual object attributes
      or variabiles that must respect validation 
      */
    const schema = Joi.object({
      name: Joi.string().min(3).max(255),
      password: Joi.string().min(5).max(256).allow('$'),

    });
//mongoose.Types.ObjectID.isValid(id); 
    const result = schema.validate(user);
    if(result.error){return result.error.details[0].message}//
    return 0;

  }


module.exports.User = User; // = mongoose.model('users', UserSchema);
module.exports.validateUserData = validateUserData;