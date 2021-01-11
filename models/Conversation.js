const mongoose = require('mongoose');

// Create a schema for user (to describe the data structure)
const ConversationSchema = mongoose.Schema({
    username_a: {
        type: String,
        required: true
    },

    username_b: {
        type: String,
        required: true
    },
    
    messages: {
        type: []
    }
});


module.exports = mongoose.model('conversations', ConversationSchema);