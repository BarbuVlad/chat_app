const express = require('express');
const moment = require('moment');
const router = express.Router();

const {User, validateUserData} = require('../models/User');
const {Conversation} = require('../models/Conversation');
const bcrypt = require('bcrypt');

const { authorization } = require("../config/authorization");
const { adminAllow } = require('../config/adminAllow');
//----------GET----------
router.get('/', [authorization, adminAllow],async (req,res) => {
    try{
        const users = await User.find();
        res.status(200).json({message:users, code:0});
    } catch(err){
        res.json({message: err, code:1});
    }
});


///:name 'name': req.params.name
router.get('/self', authorization, async (req,res) => {
    //req.user set by authorization middleware
    //contacts 
    try{
        //create query
        let selected = "";
        for(const i in req.query){
            if(
            i==='password' || 
            i==='isAdmin' || 
            i==='__v'||
            i==='format_lists'
            ){continue;}///<do not allow those values
            selected+=i+' ';
        }
        selected+='-_id';
        //const user = await User.findOne({'name':req.user.name}).select('-password');
        const user = await User.findById(req.user._id).select(selected);

        if(req.query.format_lists==="true"){
            const format = async (list=[]) => { 
                let formated_list=[];
                 await Promise.all(list.map( async (contact)=>{ ///< await an array of promises

                    let contact_id_key = Array.from( contact.keys() )[0];
                    let contact_id = contact.get(contact_id_key);

                    let conv_id_key =  Array.from( contact.keys() )[1];
                    let conv_id =  contact.get(conv_id_key);

                    //get username for this id
                    try{
                    const x = await User.findById(contact_id).select("name -_id");
                    formated_list.push({contact_id:contact_id, username:x.name, conv_id:conv_id});
                    } catch (err){///<push id as username
                        formated_list.push({contact_id:contact_id, username:contact_id, conv_id:conv_id});
                    }
                    
                }));
                //formated_list.push();
                return formated_list;
            }
            user.contacts = await format(user.contacts);
            user.pending_contacts = await format(user.pending_contacts);
            user.invites = await format(user.invites);
        }

        res.status(200).json({data:user, code:0});
    } catch(err){
        console.log(`Error at find userById: ${err}`);
        res.status(400).json ({message: `No user found!`});
    }
});



router.get('/pre_invite/:name', [authorization],async (req,res) => {
    /* Used to add other user to contact list (send invitation u.c.) 
     * code: 0 -> user found by name, _id returned 
     * code: 1 -> user already in contacts
     * code: 2 -> user invite already sent (in pending_contacts)
     * code: 3 -> user already invited by other user(invitee)
     * code: 4 -> user not found or other error
     * 
     > On front-end: show result, confirm send invitation (call /invite endpoint) 
     */
    try{
        const invitee = await User.findOne({'name': req.params.name}).select("_id pending_contacts");
        const inviter = await User.findById(req.user._id).select("pending_contacts contacts");

        //look in user contacts
        inviter.contacts.map(contact=>{
            let contact_id_key = Array.from( contact.keys() )[0];///<"contact_id"
            let contact_id = contact.get(contact_id_key);///< id value
            //let conv_id = a.get(user_id);
            if(invitee._id == contact_id){
                return res.status(200).json({message:"User already in contacts", code:1});
            }
        });
        //look in pending contacts (invite sent to this user)
        inviter.pending_contacts.map(contact=>{
            let contact_id_key = Array.from( contact.keys() )[0];
            let contact_id = contact.get(contact_id_key);
            //let conv_id = a.get(user_id);
            if(invitee._id == contact_id){
                return res.status(200).json({message:"Invitation already sent to user", code:2});
            }
        });
        //look in that other user invitations (inviter already invited by invitee)
        invitee.pending_contacts.map(contact=>{
            let contact_id_key = Array.from( contact.keys() )[0];
            let contact_id = contact.get(contact_id_key);
            //let conv_id = a.get(user_id);
            if(req.user._id == contact_id){
                return res.status(200).json({message:"You have already been invited by this user", code:3});
            }
        });

        return res.status(200).json({message:"User found. You can send an invite", code:0, invitee_id:invitee._id});
    } catch(err){
        console.log(`Error at find userById: ${err}`);
        res.status(400).json ({message: `No user found!`, code:4});
    }
});

//-----------POST-----------
router.post('/register', async (req, res) => {
    //create a new user
    const user = new User({
        name: req.body.name,
        password: req.body.password
    });

    //check data
    // const valid = validateUserData(user);
    // if(valid !== 0) {
    //     return res.status(400).json({message:'Invalid data', error:valid, pass:user.password});
    // }
    if(!req.body.name || !req.body.password){
        return res.status(400).json({message:'Invalid data (username or password missing)', code:1});
    }
    //reset password to hash:
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    //save to DB
    try{
    const savedUser = await user.save(); //wait for DB response
    res.status(200).json({message:`User ${user.name} created successfully!`, code:0});//`User ${user.name} created! `

    } catch (err){
        console.log(`User NOT created. ERROR: ${err}`);

        if(err.code == 11000){
        res.status(400).json({message:`User ${user.name} already exists!`, code:2});
        } else{
            res.status(500).json({message:`User ${user.name} NOT created, error occured!`, code:-1});
        }
    }
});

router.post('/login', async (req, res) => {
    try{
    //get user
    let user = await User.findOne({name: req.body.name});
    //console.log(`\nUSER ${user._id}\n`);
    //check data
    if(!req.body.name || !req.body.password || !user){
        return res.status(400).json({message:'Invalid data.', code:1});
    }
    const valid_password = await bcrypt.compare(req.body.password, user.password);
    if(!valid_password){
        return res.status(400).json({message:'Invalid data.', code:2});
    }
    const token = user.generateAuthToken();

    res.status(200).json({message:`User ${user.name} login successfully!`, 
    token: token, 
    username:user.name, 
    id:user._id,
    code:0});
}catch(err){
    console.log("Login error:\n",err);
    return res.status(500).json({message:'Server error.', code:3});
}
    //res.header('x-auth-token', token).status....
});


//-----------PUT-----------
//send invite
router.put('/invite', authorization, async (req,res) => {
    /**Send an invitation from one user to another (frontend u.c.)
     * An invite has to have the following actions:
     * 1. Create a new conversation document 
     * 2. Update inviter pending_contacts list
     * 3. Update invitee invites list
     *** TODO: put those op. in a two-phase-commit (transaction)
     *** Not covered: if a invites b successfully, another invite  can't be sent(unique index on a-b),
     however b can invite a (this shouldn't be possible: a conversation exists... TODO)
     */
    if(!req.body.invitee_id){
        return res.status(400).json({"message":"Invitee id missing", code:1});
    }
     const conversation = new  Conversation({
        username_a_ref: req.user._id,
        username_b_ref: req.body.invitee_id,
        messages: [{"bot":["Conversation can be started!", moment().format('h:mm a')]}]
    });

    try{
        invitee_id = req.body.invitee_id;
        inviter_id = req.user._id;
        const savedConversation = await conversation.save();
        
        const updatedInviter = await User.updateOne(
            { _id: req.user._id},
            //update pending_contacts list:
            { $push: {pending_contacts: {invitee_id:invitee_id, conversation_id:savedConversation._id} }}
        );
        const updatedInvitee = await User.updateOne(
            { _id: invitee_id},
            //update invites list:
            { $push: {invites: {inviter_id:inviter_id, conversation_id:savedConversation._id} }}
        );
        if(updatedInvitee["ok"]==1 && updatedInviter["ok"]==1){
            return res.status(200).json({message:"Invitation sent successfully", code:0});
        } else{
            return res.status(200).json({message:"Invitation not sent. Error occurred.", code:2});
        }

    } catch(err){
        if(err.code===11000){
            return res.status(400).json({"message":"Conversation already exists between this 2 users", code:3});
        }
        return res.status(500).json({message:"Server error",error:err, code:4});
    }

});

router.put('/accept_invite', authorization,async (req,res) => {
    /**Accepting an invite (frontend u.c.)
     * This action has to have the following operations:
     * 1. Pop element from invites for this user
     * 2. Pop element from pending_users for the other user
     * 3. For this user add to contacts the other user (push)
     * 4. For the other add to contacts this user (push)
     * *** TODO: put those op. in a two-phase-commit (transaction)
     */
     if(!req.body.inviter_id || !conversation_id){
        return res.status(400).json({"message":"Invitee id or conversation id missing", code:1});
    }
    try{
        let results = {};
        //Step 1:(invitee is this user)
        const invitee  =  await User.findById(req.user._id).select("invites");
        invitee.invites =  invitee.invites.filter((i) => {i.conversation_id!=req.body.conversation_id; });
        
        let updatedInvitee = await User.updateOne( /*{ n: 1, nModified: 1, ok: 1 } */
            { _id: req.user._id},
            //update invites:
            { $set: {invites: invitee.invites  } }
        );
        results["inviteePop"] = updatedInvitee["nModified"];
        //Step 2:
        const inviter  =  await User.findById(req.body.inviter_id).select("pending_contacts");
        inviter.pending_contacts =  inviter.pending_contacts.filter((c) => {c.conversation_id!=req.body.conversation_id; });

        let updatedInviter = await User.updateOne(
            { _id: req.body.inviter_id},
            //update pending_contacts:
            { $set: {pending_contacts: inviter.pending_contacts  } }
        );
        results["inviterPop"] = updatedInviter["nModified"];
        //Step 3:
        updatedInvitee = await User.updateOne(
            { _id: req.user._id},
            //update contacts list (add the other user):
            { $push: {contacts: {contact_id:req.body.inviter_id, conversation_id:req.body.conversation_id} }}
        );
        results["inviteePush"] = updatedInvitee["nModified"];
        //Step 4:
        updatedInviter = await User.updateOne(
            { _id: req.body.inviter_id},
            //update contacts list (add the other user):
            { $push: {contacts: {contact_id:req.user._id, conversation_id:req.body.conversation_id} }}
        );
        results["inviterPush"] = updatedInviter["nModified"];

        console.log("Accepted invite.Res: ",results);
        return res.status(200).json({"message":"Invite accepted. Operations successfull.", code:0});
    }catch(err){
        console.log(`Error at update user. ERROR: ${err}`);
        res.status(400).json({message:`Failed to update user`, code:2});
    }
});

router.patch('/block_action', [authorization, adminAllow], async(req, res) =>{
    /* Update selected user with block */
    if(!req.body.user_id){
        return res.status(400).json({"message":"User id missing", code:1});
    }
    if(req.user._id === req.body.user_id){
        return res.status(400).json({"message":"You cannot block/unblock yourself", code:2});
    }
    if(req.query.action !== "block" && req.query.action!=="unblock"){
        req.query.action="block";///< default action to this value
    }
    
    try{
        let bool_val;
        req.query.action==="block" ? bool_val=true : bool_val=false;
        let updatedUser = await User.updateOne( /*{ n: 1, nModified: 1, ok: 1 } */
            { _id: req.body.user_id},
            //update invites:
            { $set: {blocked: bool_val  } }
        );
        
        if(updatedUser.ok == 1){///<modified successfully
            //console.log(req.query.action,"  -  ", bool_val,"  -  ", updatedUser)
            return res.status(200).json({"message":"User blocked/unblocked successfully", code:0});
            
        } else{///<not modified
            return res.status(500).json({"message":"User not blocked/unblocked. Object not modified", code:3});
        }

    }catch(err){///<error
        return res.status(500).json({"message":"Error occurred", code:4});
    }
});


//-----------DELETE-----------

module.exports = router;