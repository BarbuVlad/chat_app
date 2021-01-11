const mongoose = require('mongoose');

// Create a schema for user (to describe the data structure)
const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    password: {
        type: String
      //  required: true
    },
    
    contacts: {
        type: Map //.map = new Map([['key', 'value']]); key is other user ID, value is conversation ID 
    }
});


module.exports = mongoose.model('users', UserSchema);