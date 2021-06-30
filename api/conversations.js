const express = require('express');
const router = express.Router();

const {User, validateUserData} = require('../models/User');
const {Conversation} = require('../models/Conversation');

const { authorization } = require("../config/authorization");
//----------GET----------
router.get('/:conversation_id', [authorization],async (req,res) => {
    
    try{
        const conversation = await Conversation.findById(req.params.conversation_id).select("-_id");
        //is this user a part of the conversation?
        if(req.user._id != conversation.username_a_ref && req.user._id != conversation.username_b_ref){
            return res.status(400).json({message:"Conversation not found!", code:1});
        }
        return res.status(200).json({message:"Conversation found!", code:0, conversation:conversation.messages});
    }catch(err){
        return res.status(500).json({message:"Error occurred!", code:2});
    }

});


// //Get user by id
// router.get('/:id', async (req,res) => {
    
// })

// //-----------CREATE-----------
// router.post('/', async (req, res) => {

// });

// //-----------UPDATE-----------
// //update user name by id
// router.put('/:id', async (req,res) => {

// })

// //-----------DELETE-----------
// router.delete('/:id', async (req, res) => {

// })

module.exports = router;