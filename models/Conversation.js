const mongoose = require('mongoose');

// Create a schema for user (to describe the data structure)
const ConversationSchema = mongoose.Schema({

    username_a_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'//<can be used with .find().populate() function
    },

    username_b_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'//<can be used with .find().populate() function
    },
    
    messages: {
        type:[ {type:Map, of: []} ],  // "name" => ["message", "date_and_time"]
        default: []
    }
});
//Schema methods:
    //...

const Conversation = mongoose.model('conversations',ConversationSchema);//model
module.exports.Conversation = Conversation;
/*.find()
.populate('username_a_ref', 'name -_id') -> will expand a prop in select with name and exclude _id
.populate('username_b_ref', 'name -_id')
.select('messages, username_a_ref')
*/